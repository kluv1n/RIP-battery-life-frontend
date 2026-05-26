import type { FormEvent } from "react";
import "./ServicesFilterBar.css";

export interface ServicesFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export default function ServicesFilterBar({ query, onQueryChange, onSearch }: ServicesFilterBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="services-filter-bar toolbar__search-form">
      <form className="search-form services-filter-bar__form" onSubmit={handleSubmit}>
        <label htmlFor="catalog-title-search" className="visually-hidden">
          Поиск по типу аккумулятора
        </label>
        <span className="search-bar">
          <input
            id="catalog-title-search"
            type="search"
            className="search-input form-control"
            placeholder="Search by battery type"
            value={query}
            autoComplete="off"
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <button type="submit" className="search-btn" aria-label="Search">
            <svg className="search-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M16 16l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </span>
      </form>
    </div>
  );
}
