import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import FrLocale from "@fullcalendar/core/locales/fr";
import RootLayout from "@/pages/layout";
import { mockPlanning } from "../mock";

export default function PlanningPage() {
    const calendarRef = useRef<FullCalendar>(null);

    // Example data
    const data = mockPlanning.data;

    // Example personal events
    const userEvents = {
        events: [
            {
                title: "Complexe sportif d'Ennetières",
                start: "2025-03-05T10:10:00",
                end: "2025-03-05T12:30:00",
                classNames: ["est-perso"],
            },
            {
                title: "TD Auto Géré\nISEN A906 Anglais",
                start: "2025-03-06T10:20:00",
                end: "2025-03-06T12:20:00",
                classNames: ["TD_AUTO_GERE_PLANIFIE"],
            },
        ],
    };

    // Add custom styles for FullCalendar
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
      .fc .fc-button {
        color: #2D1E43 !important;
        background-color: white !important;
        border-radius: 100px !important;
        box-shadow: 0 12px 32px rgba(45, 30, 67, 0.2);
        font-weight: 600 !important;
        font-size: 0.88rem !important;
        border: none !important;
      }
      
      .fc .fc-button-active {
        background: linear-gradient(45deg, #F27935, #B25B43) !important;
        box-shadow: 0 12px 24px rgba(242, 121, 53, 0.24);
        color: white !important;
      }
      
      .fc .fc-timegrid {
        border: 0 !important;
        outline: 0 !important;
        background-color: rgba(255, 255, 255, 0.24);
        backdrop-filter: blur(12px);
        opacity: 0;
        animation: appear 0.5s ease forwards;
      }
      
      .fc .fc-timegrid-event {
        border-radius: 6px;
        line-height: 1.3;
        padding: 2px;
        border: 0;
      }
      
      .fc .fc-timegrid-slot-minor {
        border-top-style: dashed;
        border-top-color: #afa6a244;
      }
      
      .fc .fc-timegrid-slot-label-cushion {
        font-size: 0.8rem;
        font-weight: 600;
      }
      
      .fc .fc-timegrid-col.fc-day-today {
        background-color: hsla(16, 70%, 80%, 0.25);
      }
      
      .fc-timegrid-event,
      .fc-timegrid-more-link {
        background: linear-gradient(45deg, #2D1E43, #3D2A53) !important;
        backdrop-filter: blur(12px);
        box-shadow: 0 16px 32px rgba(45, 30, 67, 0.24);
        color: white !important;
      }
      
      .est-epreuve {
        color: white !important;
        background: linear-gradient(45deg, #F27935, #B25B43) !important;
        box-shadow: 0 16px 32px rgba(242, 121, 53, 0.24) !important;
      }
      
      .est-perso {
        color: white !important;
        background: linear-gradient(45deg, #4CAF50, #2E7D32) !important;
        box-shadow: 0 16px 32px rgba(76, 175, 80, 0.24) !important;
      }
      
      .TD_AUTO_GERE_PLANIFIE,
      .TP_AUTO_GERE_PLANIFIE,
      .CM_AUTO_GERE_PLANIFIE,
      .PROJET_AUTO_GERE {
        color: white !important;
        background: linear-gradient(45deg, #4CAF50, #2E7D32) !important;
        box-shadow: 0 16px 32px rgba(76, 175, 80, 0.24) !important;
      }
      
      @keyframes appear {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      
      .dark .fc-timegrid {
        background-color: rgba(255, 255, 255, 0.08);
      }
      
      .dark .fc-timegrid-event:not(.est-epreuve),
      .dark .fc-timegrid-more-link:not(.est-epreuve) {
        background: linear-gradient(45deg, #3D2A53, #2D1E43) !important;
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.24);
      }
      
      .dark .fc-timegrid-event.TD_AUTO_GERE_PLANIFIE,
      .dark .fc-timegrid-more-link.TD_AUTO_GERE_PLANIFIE,
      .dark .fc-timegrid-event.TP_AUTO_GERE_PLANIFIE,
      .dark .fc-timegrid-more-link.TP_AUTO_GERE_PLANIFIE,
      .dark .fc-timegrid-event.CM_AUTO_GERE_PLANIFIE,
      .dark .fc-timegrid-more-link.CM_AUTO_GERE_PLANIFIE,
      .dark .fc-timegrid-event.PROJET_AUTO_GERE,
      .dark .fc-timegrid-more-link.PROJET_AUTO_GERE {
        color: white !important;
        background: linear-gradient(45deg, #81C784, #4CAF50) !important;
        box-shadow: 0 16px 32px rgba(76, 175, 80, 0.24) !important;
      }
      
      .dark .fc-timegrid-event.est-perso {
        color: white !important;
        background: linear-gradient(45deg, #4CAF50, #2E7D32) !important;
        box-shadow: 0 16px 32px rgba(76, 175, 80, 0.24) !important;
      }
      
      .fc-col-header,
      .fc-daygrid-body,
      .fc-scrollgrid-sync-table,
      .fc-timegrid-body, 
      .fc-timegrid-body table {
        width: 100% !important;
      }
      
      .fc .fc-button-group {
        display: flex;
        flex: 1 !important;
        width: unset !important;
        justify-content: flex-end;
        gap: 8px;
      }
      
      .fc .fc-header-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      
      .fc .fc-event-time {
        white-space: normal !important;
        margin-bottom: 8px !important;
      }
    `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <RootLayout>
            <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="text-3xl font-bold text-mauria-light-purple dark:text-white mt-4 mb-6"
                >
                    Planning
                </motion.h2>

            <motion.section
                    className="rounded-lg overflow-hidden shadow-lg"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                >
                    <FullCalendar
                        datesSet={() => {
                            window.dispatchEvent(new Event("resize"));
                        }}
                        ref={calendarRef}
                        locale={FrLocale}
                        plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            interactionPlugin,
                        ]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: "today",
                            center: "timeGridWeek,timeGridDay",
                            right: "prev,next",
                        }}
                        slotMinTime="07:00:00"
                        slotMaxTime="22:00:00"
                        titleFormat={{ month: "short", day: "numeric" }}
                        allDaySlot={false}
                        firstDay={0}
                        hiddenDays={[0]}
                        eventSources={[data, userEvents]}
                        eventColor="#3f2a56"
                        contentHeight="auto"
                        nowIndicator={true}
                        stickyHeaderDates={false}
                        editable={false}
                        eventAllow={() => false}
                        droppable={false}
                        eventStartEditable={false}
                        eventDurationEditable={false}
                        eventResizableFromStart={false}
                        eventClick={(info) => {
                            // Handle event click
                            console.log(info.event);
                        }}
                    />
                    <div className="text-sm font-semibold mt-2 ml-2 text-mauria-light-purple dark:text-gray-300">
                        {/* Dernière actualisation : {dayjs().fromNow()} */}
                        Dernière actualisation : il y a ///// minutes
                    </div>
            </motion.section>
        </RootLayout>
    );
}
