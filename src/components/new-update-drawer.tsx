"use client"

import { useEffect, useState } from "react"
import { CodeXml, Eye } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription, } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

const LAST_SEEN_UPDATE_KEY = "lastSeenUpdate"

export default function NewUpdateDrawer() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const newUpdate = localStorage.getItem(LAST_SEEN_UPDATE_KEY)
      if (newUpdate !== "1.0") { // TODO : fetch updates 
        localStorage.setItem(LAST_SEEN_UPDATE_KEY, "1.0")
        setOpen(true)
      }
    } catch {
      console.error("Accès à localStorage interdit")
    }
  }, [])

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="p-0 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <DrawerHeader className="px-6 pt-6 pb-3 items-center text-center">
            <DrawerTitle className="flex items-center justify-center gap-2">
              Y'a du nouveau sur Mauria !
            </DrawerTitle>
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Voici les améliorations apportées par dernière mise à jour.<br/><br/>
              <Badge variant="secondary">22 février 2024</Badge>
            </p>
          </DrawerHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 touch-pan-y [-webkit-overflow-scrolling:touch]">
          <Alert className="mb-4">
            <Eye className="h-4 w-4" />
            <AlertTitle>Améliorations visuelles</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                <li>Ajout de la mise à jour automatique du planning, des notes et des absences au lancement de l'application (7 s d'update après lancement) → notifications si nouvelle(s) note(s) !</li>
                <li>Modal des événements du planning (avec les détails + suppression des events perso)</li>
                <li>Partie Agenda permettant d'avoir un "bloc-note" pour les événements perso AVEC les notifications</li>
                <li>Événements Junia (via un calendrier de Campusia)</li>
                <li>Page Outils Junia contenant les liens utiles pour les étudiants (liée avec Strapi)</li>
                <li>Vue pour iPad (navigation en colonne)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert className="mb-4">
            <CodeXml className="h-4 w-4" />
            <AlertTitle>Améliorations techniques</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                <li>Passage sous Ionic Capacitor v5 (avec les dépendances associées)</li>
                <li>Cours auto-géré → nouvelle couleur</li>
                <li>Affichage des commentaires avec les notes (s’il y en a)</li>
                <li>Modification de la NavBar pour ajouter les outils Junia</li>
                <li>Changement de la transition entre les pages</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DrawerFooter className="px-6 pb-6 border-t">
          <DrawerClose asChild>
            <Button>D'accord !</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
