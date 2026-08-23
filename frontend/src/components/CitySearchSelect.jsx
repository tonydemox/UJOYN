// src/components/CitySearchSelect.jsx
import { useState, useMemo, useRef, useEffect } from 'react';

export default function CitySearchSelect({ cities, value, onSelect }) {
    const [query, setQuery] = useState(value ? `${value.name} (${value.province})` : '');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const filteredCities = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return cities
            .filter((city) => city.name.toLowerCase().startsWith(lowerQuery))
            .slice(0, 50);
    }, [cities, query]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSelect(city) {
        onSelect(city);
        setQuery(`${city.name} (${city.province})`);
        setIsOpen(false);
    }

    return (
        <div className="city-search" ref={containerRef}>
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    if (value) onSelect(null);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Inizia a scrivere il nome del comune..."
                autoComplete="off"
            />

            {isOpen && filteredCities.length > 0 && (
                <ul className="city-search-results">
                    {filteredCities.map((city) => (
                        <li key={city._id} onClick={() => handleSelect(city)}>
                            {city.name} <span className="city-province">({city.province})</span>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && query.trim() && filteredCities.length === 0 && (
                <ul className="city-search-results">
                    <li className="city-search-empty">Nessun comune trovato</li>
                </ul>
            )}
        </div>
    );
}