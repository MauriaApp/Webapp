import { createContext, useContext, useState, ReactNode } from "react";

interface CurrentYearContextType {
    showCurrentYearOnly: boolean;
    toggleCurrentYearFilter: () => void;
    setShowCurrentYearOnly: (value: boolean) => void;
}

const CurrentYearContext = createContext<CurrentYearContextType | undefined>(
    undefined
);

interface CurrentYearProviderProps {
    children: ReactNode;
}

export const CurrentYearProvider: React.FC<CurrentYearProviderProps> = ({
    children,
}) => {
    const [showCurrentYearOnly, setShowCurrentYearOnly] =
        useState<boolean>(false);

    const toggleCurrentYearFilter = () => {
        setShowCurrentYearOnly((prev) => !prev);
    };

    const value: CurrentYearContextType = {
        showCurrentYearOnly,
        toggleCurrentYearFilter,
        setShowCurrentYearOnly,
    };

    return (
        <CurrentYearContext.Provider value={value}>
            {children}
        </CurrentYearContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrentYear = (): CurrentYearContextType => {
    const context = useContext(CurrentYearContext);
    if (context === undefined) {
        throw new Error(
            "useCurrentYear must be used within a CurrentYearProvider"
        );
    }
    return context;
};
