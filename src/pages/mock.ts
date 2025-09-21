import { Absence } from "@/utils/absences";
import { Grade } from "@/utils/grades";

export const mockGrades: { success: boolean; data: Grade[] } = {
    success: true,
    data: [
        {
            date: "02/05/2025",
            code: "2425_ISEN_M1S8_PROJET_EVAL",
            name: "Evaluation du  Projet Semestre 8",
            grade: " 18.33",
            coefficient: "1",
            average: " 14.97",
            min: " 05.61",
            max: " 18.33",
            median: " 15.72",
            standardDeviation: " 02.52",
            comment: "",
        },
        {
            date: "15/03/2025",
            code: "2425_ISEN_M1S8_BDD_NOSQL_PROJ",
            name: "Projet du Module Base de données non relationnelle",
            grade: " 15.00",
            coefficient: "0,5",
            average: " 16.10",
            min: " 12.00",
            max: " 19.00",
            median: " 16.00",
            standardDeviation: " 01.19",
            comment: "",
        },
        {
            date: "15/03/2025",
            code: "2425_ISEN_M1S8_BDD_NOSQL_PROJ",
            name: "Projet du Module Base de données non relationnelle",
            grade: " 15.00",
            coefficient: "1",
            average: " 16.10",
            min: " 12.00",
            max: " 19.00",
            median: " 16.00",
            standardDeviation: " 01.19",
            comment: "",
        },
    ],
};

export const mockAbsences: { success: boolean; data: Absence[] } = {
    success: true,
    data: [
        {
            date: "07/12/21",
            type: "Absence non excusée",
            duration: "2:05",
            time: "10:20 - 12:25",
            class: "Mathématiques 2 : Analyse - Mathématiques 2 : Analyse",
            teacher: "Laura SAINI",
        },
        {
            date: "23/11/21",
            type: "Absence excusée avec justificatif",
            duration: "2:05",
            time: "08:00 - 10:05",
            class: "Mathématiques 2 : Analyse",
            teacher: "Laura SAINI",
        },
    ],
};

export const mockPlanning = {
    success: true,
    data: [
        {
            id: "67235640",
            title: "ALG Salle 222 H\n\nUrbanisation et Gestion des Services IT\nCOURS_TD\nMonsieur VAN MOERKERCKE",
            start: "2025-09-23T00:30:00+0200",
            end: "2025-09-23T12:15:00+0200",
            allDay: false,
            editable: true,
            className: "COURS_TD",
        },
        {
            id: "67235317",
            title: "IC2 B506     (H)\n\nUrbanisation et Gestion des Services IT\nCOURS_TD\nMonsieur MARIAGE",
            start: "2025-09-23T13:30:00+0200",
            end: "2025-09-23T17:15:00+0200",
            allDay: false,
            editable: true,
            className: "COURS_TD",
        },
    ],
};
