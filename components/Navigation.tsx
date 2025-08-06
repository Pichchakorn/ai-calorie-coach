import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown_menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, Settings, LogOut, User, Menu, X } from 'lucide-react';

interface NavigationProps {
  onNavigate: (page: 'dashboard' | 'settings') => void;
  currentPage: string;
}

export function Navigation({ onNavigate, currentPage }: NavigationProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const handleNavigation = (page: 'dashboard' | 'settings') => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className="border-b sticky top-0 z-50"
      style={{
        background: 'linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.04 230 / 0.3) 50%, oklch(0.98 0.04 330 / 0.2) 100%)',
        borderBottom: '1px solid oklch(0.9 0.08 280 / 0.3)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 p-2 hover:bg-ocean/10"
            >
              <Calculator className="h-6 w-6 text-ocean" />
              <span 
                className="sr-only md:not-sr-only font-medium"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                AI Calorie Coach
              </span>
            </Button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onNavigate('dashboard')}
              className={currentPage === 'dashboard' 
                ? "text-white" 
                : "hover:bg-ocean/10 text-ocean"
              }
              style={currentPage === 'dashboard' 
                ? { background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }
                : {}
              }
            >
              แดชบอร์ด
            </Button>
            <Button
              variant={currentPage === 'settings' ? 'default' : 'ghost'}
              onClick={() => onNavigate('settings')}
              className={currentPage === 'settings' 
                ? "text-white" 
                : "hover:bg-sunset/10 text-sunset"
              }
              style={currentPage === 'settings' 
                ? { background: 'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))' }
                : {}
              }
            >
              ตั้งค่า
            </Button>
          </nav>

          {/* Desktop User Menu & Logout */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm text-ocean font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full border-ocean/20 hover:bg-ocean/10"
                  style={{
                    border: '2px solid oklch(0.6 0.2 230 / 0.2)'
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback 
                      className="text-white font-medium"
                      style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))' }}
                    >
                      {user ? getInitials(user.name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-ocean font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('dashboard')} className="text-ocean hover:bg-ocean/10">
                  <Calculator className="mr-2 h-4 w-4" />
                  <span>แดชบอร์ด</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('settings')} className="text-sunset hover:bg-sunset/10">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>ตั้งค่า</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-rose hover:bg-rose/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ออกจากระบบ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Standalone Logout Button for clarity */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="text-rose border-rose/30 hover:bg-rose/10 hover:border-rose/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback 
                    className="text-white text-sm font-medium"
                    style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))' }}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 hover:bg-ocean/10">
                  <Menu className="h-5 w-5 text-ocean" />
                  <span className="sr-only">เปิดเมนู</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left text-ocean">เมนู</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* User Info */}
                  {user && (
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, oklch(0.98 0.04 230 / 0.3), oklch(0.98 0.04 330 / 0.2))',
                        border: '1px solid oklch(0.9 0.08 280 / 0.3)'
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback 
                          className="text-white font-medium"
                          style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))' }}
                        >
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-ocean font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <nav className="space-y-3">
                    <Button
                      variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                      onClick={() => handleNavigation('dashboard')}
                      className={`w-full justify-start ${
                        currentPage === 'dashboard' 
                          ? 'text-white' 
                          : 'hover:bg-ocean/10 text-ocean'
                      }`}
                      style={currentPage === 'dashboard' 
                        ? { background: 'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))' }
                        : {}
                      }
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      แดชบอร์ด
                    </Button>
                    <Button
                      variant={currentPage === 'settings' ? 'default' : 'ghost'}
                      onClick={() => handleNavigation('settings')}
                      className={`w-full justify-start ${
                        currentPage === 'settings' 
                          ? 'text-white' 
                          : 'hover:bg-sunset/10 text-sunset'
                      }`}
                      style={currentPage === 'settings' 
                        ? { background: 'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))' }
                        : {}
                      }
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      ตั้งค่า
                    </Button>
                  </nav>

                  {/* Logout Button - Prominent in Mobile */}
                  <div className="pt-6 border-t border-muted">
                    <Button
                      onClick={handleLogout}
                      className="w-full justify-start text-white"
                      style={{ background: 'linear-gradient(135deg, oklch(0.65 0.2 320), oklch(0.7 0.15 320))' }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      ออกจากระบบ
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}