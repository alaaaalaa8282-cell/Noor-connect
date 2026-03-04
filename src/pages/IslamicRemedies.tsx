import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { EnhancedMoodSelector } from "@/components/EnhancedMoodSelector";

export default function IslamicRemedies() {
    return (
        <PageTransition>
            <div className="min-h-screen bg-background pb-32">
                <AppBar title="Islamic Remedies" showBack={true} />
                
                <div className="px-5 pt-4">
                    <EnhancedMoodSelector />
                </div>
            </div>
        </PageTransition>
    );
}
