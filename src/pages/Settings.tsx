import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { animationEnabled, toggleAnimation, greetingEnabled, toggleGreeting } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-4">{t('settings')}</h1>
      <Card className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <span>{t('animations')}</span>
          <Switch checked={animationEnabled} onCheckedChange={toggleAnimation} />
        </div>
        <div className="flex items-center justify-between">
          <span>{t('greeting')}</span>
          <Switch checked={greetingEnabled} onCheckedChange={toggleGreeting} />
        </div>
      </Card>
      <Button className="mt-4" onClick={() => {
        // optional: reset to defaults
        localStorage.removeItem('animationEnabled');
        localStorage.removeItem('greetingEnabled');
        window.location.reload();
      }}>{t('reset')}</Button>
    </div>
  );
};

export default Settings;
