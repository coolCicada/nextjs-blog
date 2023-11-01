import { memo, useCallback, useEffect } from 'react';
import { Country } from './types';
import styles from './countrieslist.module.scss'

interface CountriesListProps {
    countries: Country[];
    onCountryChanged: (country: Country) => void;
    savedCountry?: Country;
};

const Item = memo(({ country, isSaved, onItemClick }: { country: Country, isSaved?: boolean, onItemClick: (c: Country) => void }) => {
    useEffect(() => {
        console.log("Mounted!");
    }, []);
    console.log("Render");
    const className = isSaved ? `${styles['country-item']} ${styles.saved}` : styles['country-item'];

    return (
        <button className={className} onClick={() => onItemClick(country)}>
            <img src={country.flagUrl} />
            <span>{country.name}</span>
        </button>
    );
});
const CountriesList: React.FC<CountriesListProps> = ({
    countries,
    onCountryChanged,
    savedCountry
}) => {
    console.log('CountriesList render', savedCountry)

    return (
        <div>
            {countries.map((country) => (
                <Item country={country} key={country.id} isSaved={savedCountry?.id === country.id} onItemClick={onCountryChanged} />
            ))}
        </div>
    );
};

export default CountriesList;