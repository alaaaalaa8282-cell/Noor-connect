/**
 * Haptic Integration Examples
 * Shows how to integrate haptic feedback throughout the app
 */

import hapticService from '@/lib/haptic-service';

// 1. Prayer Time Notifications
export const triggerPrayerHaptics = async (prayerName: string) => {
  await hapticService.trigger('prayer');
  console.log(`Haptic feedback triggered for ${prayerName}`);
};

// 2. Bookmark Actions
export const triggerBookmarkHaptics = async (action: 'save' | 'delete') => {
  await hapticService.trigger('bookmark');
  console.log(`Bookmark ${action} haptic feedback`);
};

// 3. UI Interactions (buttons, navigation)
export const triggerUIHaptics = async (intensity: 'light' | 'medium' = 'light') => {
  await hapticService.trigger(intensity);
};

// 4. Success/Error Feedback
export const triggerSuccessHaptics = async () => {
  await hapticService.trigger('success');
};

export const triggerErrorHaptics = async () => {
  await hapticService.trigger('error');
};

// 5. Task Completion
export const triggerCompletionHaptics = async () => {
  await hapticService.trigger('complete');
};

// 6. Quran Verse Actions
export const triggerQuranHaptics = async (action: 'bookmark' | 'share' | 'play') => {
  switch (action) {
    case 'bookmark':
      await hapticService.trigger('bookmark');
      break;
    case 'share':
      await hapticService.trigger('success');
      break;
    case 'play':
      await hapticService.trigger('light');
      break;
  }
};

// 7. Settings Changes
export const triggerSettingsHaptics = async () => {
  await hapticService.trigger('light');
};

// Example usage in components:

/*
// In a prayer notification component:
const PrayerNotification = ({ prayerName }) => {
  useEffect(() => {
    triggerPrayerHaptics(prayerName);
  }, [prayerName]);
  
  return <div>{prayerName} prayer time</div>;
};

// In a bookmark button:
const BookmarkButton = ({ verse, isBookmarked }) => {
  const handleToggle = async () => {
    if (isBookmarked) {
      await removeBookmark(verse.id);
      triggerBookmarkHaptics('delete');
    } else {
      await saveBookmark(verse);
      triggerBookmarkHaptics('save');
    }
  };
  
  return (
    <Button onClick={handleToggle}>
      {isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
    </Button>
  );
};

// In a settings component:
const SettingToggle = ({ setting, value, onChange }) => {
  const handleChange = async (newValue) => {
    await onChange(newValue);
    triggerSettingsHaptics();
  };
  
  return (
    <Switch checked={value} onCheckedChange={handleChange} />
  );
};
*/
