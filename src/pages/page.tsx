import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function Home() {
    return (
        <main className="flex-1 px-4 pb-20">
            {/* Greeting */}
            <h2 className="text-3xl font-bold text-mauria-light-purple dark:text-white mt-4 mb-6">
                Hello Mauria !
            </h2>

            {/* Alert */}
            <Alert className="mb-8 bg-[#FFE5D9] dark:bg-mauria-dark-alert border-none">
                <AlertTitle className="text-mauria-light-accent dark:text-white font-bold">
                    Message Important !
                </AlertTitle>
                <AlertDescription className="text-mauria-light-accent/90 dark:text-white/90">
                    Bienvenue sur Mauria ! N'hésitez pas à l'installer, ça va
                    être ton meilleur ami!
                </AlertDescription>
            </Alert>

            {/* Upcoming Section */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-mauria-light-purple dark:text-white mb-4">
                    À venir demain
                </h2>

                <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4 mb-4">
                    <h3 className="text-mauria-light-purple dark:text-white font-bold text-lg">
                        Développement Web
                    </h3>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <span>08:00 - 10:00</span>
                        <span className="mx-2">—</span>
                        <span className="text-mauria-light-accent dark:text-mauria-dark-accent">
                            ISEN C402 - Amphi Prépa
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">COURS_TD</div>
                </Card>

                <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4 mb-4">
                    <h3 className="text-mauria-light-purple dark:text-white font-bold text-lg">
                        Physique des Ondes
                    </h3>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <span>10:20 - 12:20</span>
                        <span className="mx-2">—</span>
                        <span className="text-mauria-light-accent dark:text-mauria-dark-accent">
                            ISEN C953 - Salle de TP
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">COURS_TD</div>
                </Card>

                <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4 mb-4">
                    <h3 className="text-mauria-light-purple dark:text-white font-bold text-lg">
                        Mathématiques 7: Mathématiques Discrètes
                    </h3>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <span>15:30</span>
                        <span className="mx-2">—</span>
                        <span className="text-mauria-light-accent dark:text-mauria-dark-accent">
                            ISEN B804 (H)
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">COURS_TD</div>
                </Card>
            </section>
        </main>
    );
}
