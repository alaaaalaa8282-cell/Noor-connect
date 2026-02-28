import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, MapPin, Bell, BellOff, Smartphone, Globe, AlertTriangle, RefreshCw, Settings, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { permissionManager, type PermissionType, type PermissionInfo } from '@/lib/permission-manager';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface PermissionManagerProps {
  className?: string;
}

const PermissionManager = ({ className }: PermissionManagerProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<Map<PermissionType, PermissionInfo>>(new Map());
  const [loading, setLoading] = useState<PermissionType | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const platform = permissionManager.getPlatform();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const allPermissions = await permissionManager.getAllPermissionsStatus();
      setPermissions(allPermissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permission status',
        variant: 'destructive'
      });
    }
  };

  const handleRequestPermission = async (type: PermissionType) => {
    setLoading(type);
    try {
      const permissionInfo = permissionManager.getPermissionInfo(type);
      
      const granted = await permissionManager.requestPermission({
        type,
        rationale: `${permissionInfo.rationale}\n\nPermission Benefits:\n${permissionInfo.benefits.map(b => `• ${b}`).join('\n')}`,
        onSuccess: () => {
          toast({
            title: '✅ Permission Granted',
            description: `${permissionInfo.title} has been enabled successfully.`,
          });
          loadPermissions(); // Refresh status
        },
        onError: (error) => {
          toast({
            title: 'Permission Denied',
            description: error.message,
            variant: 'destructive'
          });
        }
      });

      setLoading(null);
    } catch (error) {
      setLoading(null);
      toast({
        title: 'Error',
        description: 'Failed to request permission',
        variant: 'destructive'
      });
    }
  };

  const handleRefreshPermissions = async () => {
    setRefreshing(true);
    try {
      await permissionManager.refreshPermissions();
      await loadPermissions();
      toast({
        title: 'Permissions Refreshed',
        description: 'Permission status has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh permissions',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case 'denied':
        return <ShieldOff className="w-4 h-4 text-red-500" />;
      case 'prompt':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'not-supported':
        return <ShieldOff className="w-4 h-4 text-gray-400" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'granted' ? 'default' : 
                   status === 'denied' ? 'destructive' : 
                   status === 'not-supported' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant} className="text-xs">
        {status === 'granted' ? 'Granted' : 
         status === 'denied' ? 'Denied' : 
         status === 'not-supported' ? 'Not Supported' : 
         status === 'prompt' ? 'Needed' : 'Unknown'}
      </Badge>
    );
  };

  const locationPermission = permissions.get('location');
  const notificationPermission = permissions.get('notifications');

  return (
    <Card className={`p-4 space-y-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Permission Summary
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshPermissions}
          disabled={refreshing}
          className="shrink-0"
        >
          {refreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Location Permission */}
      <div className="space-y-3 p-3 rounded-lg border border-border/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm">{locationPermission?.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {locationPermission?.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(locationPermission?.status || 'prompt')}
                {getStatusBadge(locationPermission?.status || 'prompt')}
              </div>
            </div>

            {locationPermission?.status === 'granted' && (
              <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md">
                ✅ Location Enabled
              </div>
            )}

            {locationPermission?.status === 'denied' && (
              <div className="space-y-2">
                <div className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-md">
                  ❌ Location Denied
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Why Location Needed:</p>
                  <ul className="list-disc list-inside space-y-1 ml-3">
                    {locationPermission?.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {locationPermission?.status === 'prompt' && (
              <div className="space-y-2">
                <div className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-md">
                  ⚠️ Location Needed
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRequestPermission('location')}
                  disabled={loading === 'location'}
                  className="w-full"
                >
                  {loading === 'location' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Enable Location
                    </>
                  )}
                </Button>
              </div>
            )}

            {locationPermission?.status === 'not-supported' && (
              <div className="bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-md">
                ❌ Location Not Supported
              </div>
            )}
          </div>
        </div>

        {/* Platform-specific instructions */}
        {locationPermission?.status === 'denied' && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border/50">
            <div className="flex items-start gap-2 mb-2">
              {platform === 'mobile' ? (
                <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {platform === 'mobile' ? 'Mobile Location Instructions:' : 'Web Location Instructions:'}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
              <strong>How to Fix:</strong> {locationPermission?.instructions?.[platform] || 'Check your device settings'}
            </div>
          </div>
        )}
      </div>

      {/* Notification Permission */}
      <div className="space-y-3 p-3 rounded-lg border border-border/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm">{notificationPermission?.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {notificationPermission?.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(notificationPermission?.status || 'prompt')}
                {getStatusBadge(notificationPermission?.status || 'prompt')}
              </div>
            </div>

            {notificationPermission?.status === 'granted' && (
              <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md">
                ✅ Notifications Enabled
              </div>
            )}

            {notificationPermission?.status === 'denied' && (
              <div className="space-y-2">
                <div className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-md">
                  ❌ Notifications Denied
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Why Notifications Needed:</p>
                  <ul className="list-disc list-inside space-y-1 ml-3">
                    {notificationPermission?.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {notificationPermission?.status === 'prompt' && (
              <div className="space-y-2">
                <div className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-md">
                  ⚠️ Notifications Needed
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRequestPermission('notifications')}
                  disabled={loading === 'notifications'}
                  className="w-full"
                >
                  {loading === 'notifications' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Enable Notifications
                    </>
                  )}
                </Button>
              </div>
            )}

            {notificationPermission?.status === 'not-supported' && (
              <div className="bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-md">
                ❌ Notifications Not Supported
              </div>
            )}
          </div>
        </div>

        {/* Platform-specific instructions */}
        {notificationPermission?.status === 'denied' && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border/50">
            <div className="flex items-start gap-2 mb-2">
              {platform === 'mobile' ? (
                <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {platform === 'mobile' ? 'Mobile Notification Instructions:' : 'Web Notification Instructions:'}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
              <strong>How to Fix:</strong> {notificationPermission?.instructions?.[platform] || 'Check your device settings'}
            </div>
          </div>
        )}
      </div>

      {/* Overall Status */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Permission Summary</h4>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-background rounded border">
            <span>Platform:</span>
            <span className="font-medium">{platform === 'mobile' ? 'Mobile App' : 'Web App'}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-background rounded border">
            <span>Overall Status:</span>
            <span className={`font-medium ${
              Array.from(permissions.values()).every(p => p.status === 'granted') 
                ? 'text-green-600' 
                : Array.from(permissions.values()).some(p => p.status === 'denied')
                ? 'text-red-600' 
                : 'text-amber-600'
            }`}>
              {Array.from(permissions.values()).every(p => p.status === 'granted') 
                ? 'All Permissions Granted' 
                : Array.from(permissions.values()).some(p => p.status === 'denied')
                ? 'Some Permissions Denied' 
                : 'Action Needed'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PermissionManager;
