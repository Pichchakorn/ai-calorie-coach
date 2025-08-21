import React, { useCallback, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown_menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, Settings, LogOut, User, Menu } from 'lucide-react';

type PageKey = 'dashboard' | 'settings';

interface NavigationProps {
  onNavigate: (page: PageKey) => void;
  currentPage: PageKey;
}

export function Navigation({ onNavigate, currentPage }: NavigationProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = useMemo(() => {
    if (!user?.name) return '';
    return user.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);
  }, [user?.name]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
    }
  }, [logout]);

  const handleNavigation = useCallback(
    (page: PageKey) => {
      onNavigate(page);
      setMobileMenuOpen(false);
    },
    [onNavigate],
  );

  const isDashboard = currentPage === 'dashboard';
  const isSettings = currentPage === 'settings';

  return (
    <header
      className="border-b sticky top-0 z-50"
      style={{
        background:
          'linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.98 0.04 230 / 0.3) 50%, oklch(0.98 0.04 330 / 0.2) 100%)',
        borderBottom: '1px solid oklch(0.9 0.08 280 / 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleNavigation('dashboard')}
              className="flex items-center gap-2 p-2 hover:bg-ocean/10"
              aria-label="กลับไปหน้าแดชบอร์ด"
            >
              <Calculator className="h-6 w-6 text-ocean" />
              <span
                className="sr-only md:not-sr-only font-medium"
                style={{
                  background:
                    'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                AI Calorie Coach
              </span>
            </Button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="หลัก">
            <Button
              type="button"
              variant={isDashboard ? 'default' : 'ghost'}
              onClick={() => handleNavigation('dashboard')}
              aria-current={isDashboard ? 'page' : undefined}
              className={
                isDashboard ? 'text-white' : 'hover:bg-ocean/10 text-ocean'
              }
              style={
                isDashboard
                  ? {
                      background:
                        'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))',
                    }
                  : undefined
              }
            >
              แดชบอร์ด
            </Button>
            <Button
              type="button"
              variant={isSettings ? 'default' : 'ghost'}
              onClick={() => handleNavigation('settings')}
              aria-current={isSettings ? 'page' : undefined}
              className={
                isSettings ? 'text-white' : 'hover:bg-sunset/10 text-sunset'
              }
              style={
                isSettings
                  ? {
                      background:
                        'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))',
                    }
                  : undefined
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
                  type="button"
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full border-ocean/20 hover:bg-ocean/10"
                  style={{
                    border: '2px solid oklch(0.6 0.2 230 / 0.2)',
                  }}
                  aria-label="เมนูผู้ใช้"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className="text-white font-medium"
                      style={{
                        background:
                          'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))',
                      }}
                    >
                      {user ? (
                        initials || <User className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-ocean font-medium">
                      {user?.name ?? 'ผู้ใช้'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email ?? ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleNavigation('dashboard')}
                  className="text-ocean hover:bg-ocean/10"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  <span>แดชบอร์ด</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('settings')}
                  className="text-sunset hover:bg-sunset/10"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>ตั้งค่า</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-rose hover:bg-rose/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'กำลังออก...' : 'ออกจากระบบ'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Standalone Logout Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-rose border-rose/30 hover:bg-rose/10 hover:border-rose/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'กำลังออก...' : 'ออกจากระบบ'}
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2" aria-hidden="true">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className="text-white text-sm font-medium"
                    style={{
                      background:
                        'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))',
                    }}
                  >
                    {initials || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-ocean/10"
                  aria-label="เปิดเมนู"
                >
                  <Menu className="h-5 w-5 text-ocean" />
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
                        background:
                          'linear-gradient(135deg, oklch(0.98 0.04 230 / 0.3), oklch(0.98 0.04 330 / 0.2))',
                        border: '1px solid oklch(0.9 0.08 280 / 0.3)',
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback
                          className="text-white font-medium"
                          style={{
                            background:
                              'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))',
                          }}
                        >
                          {initials || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-ocean font-medium">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <nav className="space-y-3" aria-label="เมนูมือถือ">
                    <Button
                      type="button"
                      variant={isDashboard ? 'default' : 'ghost'}
                      onClick={() => handleNavigation('dashboard')}
                      aria-current={isDashboard ? 'page' : undefined}
                      className={`w-full justify-start ${
                        isDashboard ? 'text-white' : 'hover:bg-ocean/10 text-ocean'
                      }`}
                      style={
                        isDashboard
                          ? {
                              background:
                                'linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))',
                            }
                          : undefined
                      }
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      แดชบอร์ด
                    </Button>
                    <Button
                      type="button"
                      variant={isSettings ? 'default' : 'ghost'}
                      onClick={() => handleNavigation('settings')}
                      aria-current={isSettings ? 'page' : undefined}
                      className={`w-full justify-start ${
                        isSettings ? 'text-white' : 'hover:bg-sunset/10 text-sunset'
                      }`}
                      style={
                        isSettings
                          ? {
                              background:
                                'linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.7 0.15 320))',
                            }
                          : undefined
                      }
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      ตั้งค่า
                    </Button>
                  </nav>

                  {/* Logout Button */}
                  <div className="pt-6 border-t border-muted">
                    <Button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full justify-start text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, oklch(0.65 0.2 320), oklch(0.7 0.15 320))',
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? 'กำลังออก...' : 'ออกจากระบบ'}
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
