import { memo, useCallback, useState } from "react"
import { Country } from './types';
import CountriesList from "./CountriesList";

interface Props {
    countries: Country[]
}

const SelectedCountry = memo(({ country }: { country?: Country, onCountrySaved: () => void }) => {
    console.log("SelectedCountry Re-render!!!!!");
    return <div>{ country?.name } SelectedCountry list, always re-renders</div>;
});

const Country: React.FC<Props> = ({ countries }) => {
    const [counter, setCounter] = useState<number>(1);

    const [selectedCountry, setSelectedCountry] = useState<Country>();
    const [savedCountry, setSavedCountry] = useState<Country>();

    const onCountryChanged = useCallback((c: Country) => setSelectedCountry(c), []);
    const onCountrySaved = useCallback(() => setSavedCountry(selectedCountry), []);

    return (
        <>
            <h1>Country settings</h1>
            <CountriesList
                countries={countries}
                onCountryChanged={onCountryChanged}
                savedCountry={savedCountry}
            />
            <SelectedCountry
                country={selectedCountry}
                onCountrySaved={onCountrySaved}
            />
            <div style={{ margin: '50px 0'}}></div>
            <button onClick={() => setCounter(counter + 1)}>
                Click here to re-render Countries list (open the console) {counter}
            </button>
        </>
    );
}

const Page = () => {
    return <Country countries={[
        { id: 1, name: "India", flagUrl: "https://flagcdn.com/16x12/ua.png" },
        { id: 2, name: "USA", flagUrl: "https://flagcdn.com/16x12/aw.png" },
        { id: 3, name: "China", flagUrl: "https://flagcdn.com/16x12/as.png" },
        { id: 4, name: "Russia", flagUrl: "https://flagcdn.com/16x12/aw.png" },
    ]} />
}

export default memo(Page)