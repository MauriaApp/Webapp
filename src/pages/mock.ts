export const mockNotes = {
    success: true,
    data: [
        {
            date: "02/05/2025",
            code: "2425_ISEN_M1S8_PROJET_EVAL",
            epreuve: "Evaluation du  Projet Semestre 8",
            note: " 18.33",
            coefficient: "1",
            moyenne: " 14.97",
            min: " 05.61",
            max: " 18.33",
            mediane: " 15.72",
            ecartType: " 02.52",
            commentaire: "",
        },
        {
            date: "15/03/2025",
            code: "2425_ISEN_M1S8_BDD_NOSQL_PROJ",
            epreuve: "Projet du Module Base de données non relationnelle",
            note: " 15.00",
            coefficient: "0,5",
            moyenne: " 16.10",
            min: " 12.00",
            max: " 19.00",
            mediane: " 16.00",
            ecartType: " 01.19",
            commentaire: "",
        },
        {
            date: "15/03/2025",
            code: "2425_ISEN_M1S8_BDD_NOSQL_PROJ",
            epreuve: "Projet du Module Base de données non relationnelle",
            note: " 15.00",
            coefficient: "1",
            moyenne: " 16.10",
            min: " 12.00",
            max: " 19.00",
            mediane: " 16.00",
            ecartType: " 01.19",
            commentaire: "",
        },
    ],
};

export const mockAbsences = {
    success: true,
    data: [
        {
            date: "07/12/21",
            type: "Absence non excusée",
            duree: "2:05",
            heure: "10:20 - 12:25",
            classe: "Mathématiques 2 : Analyse - Mathématiques 2 : Analyse",
            prof: "Laura SAINI",
        },
        {
            date: "23/11/21",
            type: "Absence excusée avec justificatif",
            duree: "2:05",
            heure: "08:00 - 10:05",
            classe: "Mathématiques 2 : Analyse",
            prof: "Laura SAINI",
        },
    ],
};

export const mockPlanning = {
    success: true,
    data: [
        {
            id: "67235640",
            title: "ALG Salle 222 H\n\nUrbanisation et Gestion des Services IT\nCOURS_TD\nMonsieur VAN MOERKERCKE",
            start: "2025-09-19T08:30:00+0200",
            end: "2025-09-19T12:15:00+0200",
            allDay: false,
            editable: true,
            className: "COURS_TD",
        },
        {
            id: "67235317",
            title: "IC2 B506     (H)\n\nUrbanisation et Gestion des Services IT\nCOURS_TD\nMonsieur MARIAGE",
            start: "2025-09-19T13:30:00+0200",
            end: "2025-09-19T17:15:00+0200",
            allDay: false,
            editable: true,
            className: "COURS_TD",
        },
    ],
};
