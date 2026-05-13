import type { FormEvent } from "react";
import Form from "react-bootstrap/Form";
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
      <Form className="search-form services-filter-bar__form" onSubmit={handleSubmit}>
        <span className="search-bar">
          <Form.Control
            type="text"
            name="query"
            className="search-input"
            placeholder="Search by battery type"
            value={query}
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
      </Form>
    </div>
  );
}
