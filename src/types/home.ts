export type UpcomingCourse = {
    title: string;
    time: string;
    location: string;
    type: string;
};

export type HomeUpcoming = {
    current: UpcomingCourse | null;
    today: UpcomingCourse[];
    tomorrow: UpcomingCourse[];
};
