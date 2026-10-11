import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, Home, RefreshCw, Zap, Video, 
  Shield, Settings, Database, Code2, BookOpen, Sparkles,
  ArrowRight
} from 'lucide-react';
import { NavLink } from 'react-router';

const AdminPage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const adminOptions = useMemo(() => [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform with test cases and solutions',
      icon: Plus,
      gradient: 'from-emerald-500 to-teal-500',
      lightGradient: 'from-emerald-400/20 to-teal-400/20',
      shadow: 'shadow-emerald-500/20',
      iconBg: 'bg-emerald-500',
      route: '/admin/create'
    },
    {
      id: 'update',
      title: 'Update Problem',
      description: 'Edit existing problems, modify constraints, or update test cases',
      icon: Edit,
      gradient: 'from-amber-500 to-orange-500',
      lightGradient: 'from-amber-400/20 to-orange-400/20',
      shadow: 'shadow-amber-500/20',
      iconBg: 'bg-amber-500',
      route: '/admin/update'
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems from the platform permanently',
      icon: Trash2,
      gradient: 'from-rose-500 to-pink-500',
      lightGradient: 'from-rose-400/20 to-pink-400/20',
      shadow: 'shadow-rose-500/20',
      iconBg: 'bg-rose-500',
      route: '/admin/delete'
    },
    {
      id: 'video',
      title: 'Video Management',
      description: 'Upload, organize, and manage tutorial videos and resources',
      icon: Video,
      gradient: 'from-purple-500 to-indigo-500',
      lightGradient: 'from-purple-400/20 to-indigo-400/20',
      shadow: 'shadow-purple-500/20',
      iconBg: 'bg-purple-500',
      route: '/admin/video'
    }
  ], []);

  const handleCardHover = (id) => setHoveredCard(id);
  const handleCardLeave = () => setHoveredCard(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
    
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

      <div className="container mx-auto px-4 py-12 relative">
       
        <header className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl -z-10" />
          
          
          <div className="inline-flex items-center gap-2 bg-base-300/50 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-base-300">
            <Shield size={16} className="text-primary" />
            <span className="text-sm font-medium text-base-content/80">
              Administrator Access
            </span>
          </div>

        
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Admin Panel
            </span>
          </h1>
          
          <p className="text-base-content/70 text-xl max-w-2xl mx-auto leading-relaxed">
            Comprehensive control center for managing your coding platform content and resources
          </p>
        </header>

       
        <nav 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          role="navigation"
          aria-label="Admin options"
        >
          {adminOptions.map((option) => {
            const IconComponent = option.icon;
            const isHovered = hoveredCard === option.id;

            return (
              <NavLink
                key={option.id}
                to={option.route}
                className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
                onMouseEnter={() => handleCardHover(option.id)}
                onMouseLeave={handleCardLeave}
                onFocus={() => handleCardHover(option.id)}
                onBlur={handleCardLeave}
              >
                <article className={`
                  relative h-full bg-base-100 rounded-2xl overflow-hidden
                  transition-all duration-500 ease-out
                  border border-base-200
                  hover:border-transparent
                  ${option.shadow} hover:shadow-2xl
                `}>
                 
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${option.lightGradient}
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  `} />
                  
                 
                  <div className={`
                    absolute inset-0 bg-gradient-to-r ${option.gradient}
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500
                    -z-10 blur-xl
                  `} />

                 
                  <div className="relative p-8">
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="relative">
                        <div className={`
                          absolute inset-0 ${option.iconBg} rounded-xl
                          opacity-20 group-hover:opacity-30 transition-opacity
                          blur-md
                        `} />
                        <div className={`
                          relative bg-gradient-to-br ${option.gradient}
                          p-4 rounded-xl text-white
                          transform group-hover:scale-110 group-hover:rotate-3
                          transition-all duration-300
                          shadow-lg
                        `}>
                          <IconComponent size={28} aria-hidden="true" />
                        </div>
                      </div>

                   <Sparkles 
                        size={20} 
                        className={`
                          text-base-content/30 transition-all duration-500
                          ${isHovered ? 'opacity-100 rotate-180' : 'opacity-0'}
                        `}
                        aria-hidden="true"
                      />
                    </div>

                    
                    <h2 className="text-2xl font-bold text-base-content mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-base-content group-hover:to-base-content/70 group-hover:bg-clip-text transition-all">
                      {option.title}
                    </h2>
                    
                    <p className="text-base-content/70 mb-8 leading-relaxed">
                      {option.description}
                    </p>

                 
                    <div className="flex items-center justify-between">
                      <span className={`
                        flex items-center gap-2 text-sm font-medium
                        bg-gradient-to-r ${option.gradient}
                        bg-clip-text text-transparent
                        group-hover:scale-105 transition-transform
                      `}>
                        <span>Access Panel</span>
                        <ArrowRight 
                          size={16} 
                          className="group-hover:translate-x-2 transition-transform"
                          aria-hidden="true"
                        />
                      </span>

                     
                      <div className="flex gap-1" aria-hidden="true">
                        {[...Array(3)].map((_, i) => (
                          <span
                            key={i}
                            className={`
                              w-1.5 h-1.5 rounded-full bg-base-300
                              transition-all duration-300
                              ${isHovered && i < 2 ? `bg-gradient-to-r ${option.gradient} scale-125` : ''}
                            `}
                            style={{ transitionDelay: `${i * 50}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </NavLink>
            );
          })}
        </nav>

        
        <footer className="text-center mt-16">
          <div className="inline-flex items-center gap-2 text-base-content/50 text-sm bg-base-300/30 backdrop-blur-sm px-6 py-3 rounded-full">
            <Database size={14} aria-hidden="true" />
            <span>Securely managing platform content with real-time updates</span>
            <RefreshCw 
              size={14} 
              className="ml-2 animate-spin-slow" 
              aria-hidden="true"
            />
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;