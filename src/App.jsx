import React, { useState, useEffect } from 'react';
import { Beer, Wine, Droplet, User, Scale, Ruler, Plus, Trash2, Trophy, Activity, Sparkles, Calendar, Clock, History } from 'lucide-react';

const RANKS = [
  { min: 0, max: 5, name: 'Новичок', color: 'from-green-400 to-emerald-500', icon: '🌱' },
  { min: 5, max: 20, name: 'Любитель', color: 'from-blue-400 to-cyan-500', icon: '🍺' },
  { min: 20, max: 50, name: 'Опытный', color: 'from-purple-400 to-pink-500', icon: '🎯' },
  { min: 50, max: 100, name: 'Мастер Спорта', color: 'from-orange-400 to-red-500', icon: '🏆' },
  { min: 100, max: 200, name: 'Гранд-Мастер', color: 'from-red-500 to-rose-600', icon: '👑' },
  { min: 200, max: Infinity, name: 'Легендарный Литрбол', color: 'from-yellow-400 to-amber-500', icon: '⚡' }
];

const PRESETS = [
  { name: 'Пиво', amount: 500, percentage: 5, icon: Beer, color: 'bg-amber-500' },
  { name: 'Вино', amount: 150, percentage: 12, icon: Wine, color: 'bg-purple-500' },
  { name: 'Водка', amount: 50, percentage: 40, icon: Droplet, color: 'bg-blue-400' }
];

export default function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Проверяем версию перед использованием новых методов
      if (tg.version >= '6.1') {
        tg.setHeaderColor('#1e1b4b');
        tg.setBackgroundColor('#0f172a');
      }
    }
  }, []);
  
  const [profile, setProfile] = useState({
    gender: 'male',
    weight: 75,
    height: 175
  });
  
  const [allDrinks, setAllDrinks] = useState([]);
  const [newDrink, setNewDrink] = useState({
    amount: 500,
    percentage: 5,
    datetime: new Date().toISOString().slice(0, 16)
  });
  
  const [showProfile, setShowProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    const storedDrinks = localStorage.getItem('allDrinks');
    const storedProfile = localStorage.getItem('profile');
    
    if (storedDrinks) {
      setAllDrinks(JSON.parse(storedDrinks));
    }
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('profile', JSON.stringify(profile));
  }, [profile]);

  const saveDrinks = (drinks) => {
    setAllDrinks(drinks);
    localStorage.setItem('allDrinks', JSON.stringify(drinks));
  };

  const getCurrentSessionDrinks = () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return allDrinks.filter(drink => new Date(drink.datetime) > twentyFourHoursAgo);
  };

  const calculateBAC = () => {
    const currentDrinks = getCurrentSessionDrinks();
    if (currentDrinks.length === 0) return 0;

    const r = profile.gender === 'male' ? 0.68 : 0.55;
    const now = new Date();
    
    let totalBAC = 0;
    
    currentDrinks.forEach(drink => {
      const drinkTime = new Date(drink.datetime);
      const hoursElapsed = (now - drinkTime) / (1000 * 60 * 60);
      
      const alcoholGrams = (drink.amount * drink.percentage * 0.789) / 100;
      const initialBAC = alcoholGrams / (profile.weight * r);
      
      const metabolizedBAC = hoursElapsed * 0.15;
      const currentDrinkBAC = Math.max(0, initialBAC - metabolizedBAC);
      
      totalBAC += currentDrinkBAC;
    });
    
    return totalBAC;
  };

  const calculateLifetimeVolume = () => {
    return allDrinks.reduce((sum, drink) => {
      return sum + (drink.amount * drink.percentage) / 100;
    }, 0);
  };

  const addDrink = () => {
    const drink = {
      ...newDrink,
      id: Date.now()
    };
    
    saveDrinks([...allDrinks, drink]);
    
    setNewDrink({
      amount: 500,
      percentage: 5,
      datetime: new Date().toISOString().slice(0, 16)
    });
  };

  const removeDrink = (id) => {
    saveDrinks(allDrinks.filter(d => d.id !== id));
  };

  const applyPreset = (preset) => {
    setNewDrink({
      ...newDrink,
      amount: preset.amount,
      percentage: preset.percentage
    });
  };

  const getRank = () => {
    const liters = calculateLifetimeVolume() / 1000;
    return RANKS.find(rank => liters >= rank.min && liters < rank.max) || RANKS[0];
  };

  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Сегодня, ${time}`;
    if (isYesterday) return `Вчера, ${time}`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const groupDrinksByDate = () => {
    const groups = {};
    const sortedDrinks = [...allDrinks].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    
    sortedDrinks.forEach(drink => {
      const date = new Date(drink.datetime).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(drink);
    });
    
    return groups;
  };

  const bac = calculateBAC();
  const rank = getRank();
  const lifetimeVolume = calculateLifetimeVolume();
  const beerBottles = Math.floor(lifetimeVolume / 25);
  const vodkaBottles = Math.floor(lifetimeVolume / 200);
  const currentSessionDrinks = getCurrentSessionDrinks();
  const groupedDrinks = groupDrinksByDate();

  const getIntoxicationLevel = () => {
    if (bac < 0.3) return { text: 'Трезв', color: 'text-green-400', bg: 'bg-green-500' };
    if (bac < 0.5) return { text: 'Легкое опьянение', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    if (bac < 1.0) return { text: 'Среднее опьянение', color: 'text-orange-400', bg: 'bg-orange-500' };
    if (bac < 2.0) return { text: 'Сильное опьянение', color: 'text-red-400', bg: 'bg-red-500' };
    return { text: 'Критическое', color: 'text-rose-400', bg: 'bg-rose-500' };
  };

  const intoxLevel = getIntoxicationLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Литрбол Калькулятор
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-sm text-gray-300">Расчет BAC и статистика употребления</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Profile Section */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-xl">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">Профиль</h2>
            </div>
            <span className="text-2xl">{showProfile ? '▼' : '▶'}</span>
          </button>
          
          {showProfile && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Пол</label>
                <div className="flex gap-2">
                  {['male', 'female'].map(gender => (
                    <button
                      key={gender}
                      onClick={() => setProfile({ ...profile, gender })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        profile.gender === gender
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-105'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {gender === 'male' ? '👨 Мужчина' : '👩 Женщина'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Вес (кг)
                </label>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Рост (см)
                </label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Add Drink Section */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-400" />
            Добавить напиток
          </h2>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`${preset.color} p-3 rounded-xl hover:scale-105 transition-transform shadow-lg flex flex-col items-center gap-1`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{preset.name}</span>
                </button>
              );
            })}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Объем (мл)</label>
              <input
                type="number"
                value={newDrink.amount}
                onChange={(e) => setNewDrink({ ...newDrink, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Крепость (%)</label>
              <input
                type="number"
                step="0.1"
                value={newDrink.percentage}
                onChange={(e) => setNewDrink({ ...newDrink, percentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Дата и время
              </label>
              <input
                type="datetime-local"
                value={newDrink.datetime}
                onChange={(e) => setNewDrink({ ...newDrink, datetime: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
            </div>
            
            <button
              onClick={addDrink}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-medium hover:scale-105 transition-transform shadow-lg"
            >
              Добавить напиток
            </button>
          </div>
        </div>

        {/* BAC Display */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">Текущий BAC</h2>
            <span className="text-xs text-gray-400">(последние 24ч)</span>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              {bac.toFixed(2)}‰
            </div>
            <div className={`text-lg font-medium ${intoxLevel.color}`}>
              {intoxLevel.text}
            </div>
          </div>
          
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full ${intoxLevel.bg} transition-all duration-500`}
              style={{ width: `${Math.min((bac / 2) * 100, 100)}%` }}
            />
          </div>

          {currentSessionDrinks.length > 0 && (
            <div className="text-sm text-gray-300 text-center">
              Напитков в текущей сессии: {currentSessionDrinks.length}
            </div>
          )}
        </div>

        {/* Tabs: Current Session / History */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'current'
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              Текущая сессия
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <History className="w-4 h-4" />
              Вся история
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'current' && (
              <div>
                {currentSessionDrinks.length > 0 ? (
                  <div className="space-y-2">
                    {currentSessionDrinks.sort((a, b) => new Date(b.datetime) - new Date(a.datetime)).map((drink) => (
                      <div key={drink.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                        <div>
                          <div className="font-medium">{drink.amount}мл • {drink.percentage}%</div>
                          <div className="text-sm text-gray-400">{formatDateTime(drink.datetime)}</div>
                        </div>
                        <button
                          onClick={() => removeDrink(drink.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Нет напитков за последние 24 часа
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {allDrinks.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupedDrinks).map(([date, drinks]) => (
                      <div key={date}>
                        <div className="text-sm font-semibold text-purple-300 mb-2 sticky top-0 bg-slate-900/80 backdrop-blur py-2">
                          {date}
                        </div>
                        <div className="space-y-2">
                          {drinks.map((drink) => (
                            <div key={drink.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                              <div>
                                <div className="font-medium">{drink.amount}мл • {drink.percentage}%</div>
                                <div className="text-sm text-gray-400">
                                  {new Date(drink.datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <button
                                onClick={() => removeDrink(drink.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    История пуста. Добавьте первый напиток!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lifetime Stats & Rank */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">Литрбол Статистика</h2>
          </div>
          
          <div className={`text-center mb-6 p-6 rounded-2xl bg-gradient-to-r ${rank.color}`}>
            <div className="text-5xl mb-2">{rank.icon}</div>
            <div className="text-2xl font-bold">{rank.name}</div>
            <div className="text-sm opacity-90 mt-1">
              {(lifetimeVolume / 1000).toFixed(2)} литров чистого спирта
            </div>
            <div className="text-xs opacity-75 mt-1">
              Всего записей: {allDrinks.length}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl text-center">
              <Beer className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <div className="text-2xl font-bold">{beerBottles}</div>
              <div className="text-sm text-gray-400">бутылок пива 0.5л</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl text-center">
              <Droplet className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold">{vodkaBottles}</div>
              <div className="text-sm text-gray-400">бутылок водки 0.5л</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}