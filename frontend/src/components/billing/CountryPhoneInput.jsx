import React, { useEffect, useRef, useState } from "react";

const COUNTRIES = [
  { code: "IN", dial: "+91", name: "India", flag: "🇮🇳" },
  { code: "AE", dial: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "PK", dial: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "SA", dial: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "QA", dial: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "KW", dial: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "BH", dial: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "OM", dial: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "US", dial: "+1", name: "USA", flag: "🇺🇸" },
  { code: "GB", dial: "+44", name: "UK", flag: "🇬🇧" },
  { code: "AU", dial: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "CA", dial: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "SG", dial: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", dial: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "BD", dial: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "NP", dial: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "LK", dial: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "DE", dial: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "FR", dial: "+33", name: "France", flag: "🇫🇷" },
  { code: "JP", dial: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "CN", dial: "+86", name: "China", flag: "🇨🇳" },
  { code: "ZA", dial: "+27", name: "South Africa", flag: "🇿🇦" },
];

/**
 * CountryPhoneInput
 * Custom country-code + phone number input.
 * Works with React 19 — no external dependencies.
 *
 * @param {string} value - full phone string e.g. "+919876543210"
 * @param {function} onChange - called with full phone string
 */
export default function CountryPhoneInput({ value, onChange }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // India default
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Parse incoming value to set country + number
  useEffect(() => {
    if (!value) return;
    const matched = COUNTRIES.find((c) => value.startsWith(c.dial));
    if (matched) {
      setSelectedCountry(matched);
      setPhoneNumber(value.slice(matched.dial.length));
    }
  }, []); // only on mount

  // Notify parent whenever dial code or number changes
  useEffect(() => {
    onChange?.(selectedCountry.dial + phoneNumber);
  }, [selectedCountry, phoneNumber]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search)
      )
    : COUNTRIES;

  const handleSelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative flex h-11" ref={dropdownRef}>
      {/* Country Code Button */}
      <button
        type="button"
        id="country-code-btn"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-[#1C1C1C] border border-[#4d4635]/35 border-r-0 rounded-l-lg px-2.5 py-2 text-on-surface hover:border-primary/40 focus:outline-none focus:border-primary transition-colors shrink-0 min-w-[72px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="text-xs font-semibold text-primary tabular-nums tracking-tight">
          {selectedCountry.dial}
        </span>
        <span
          className={`material-symbols-outlined text-[13px] text-secondary transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Phone Number Input */}
      <input
        id="customer-phone-number"
        type="tel"
        inputMode="numeric"
        className="flex-1 bg-[#1C1C1C] border border-[#4d4635]/35 rounded-r-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-sm h-11 w-full"
        placeholder="Mobile number"
        value={phoneNumber}
        onChange={(e) =>
          setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ""))
        }
        aria-label="Mobile number"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-[200] w-64 bg-[#131313] border border-[#4d4635]/35 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#4d4635]/20 sticky top-0 bg-[#131313] z-10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]">
                search
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1C1C1C] border border-[#4d4635]/30 rounded-lg pl-8 pr-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* List */}
          <ul
            role="listbox"
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-secondary text-center">
                No countries found
              </li>
            ) : (
              filtered.map((country) => (
                <li
                  key={country.code}
                  role="option"
                  aria-selected={selectedCountry.code === country.code}
                  onClick={() => handleSelect(country)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                    selectedCountry.code === country.code
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-base w-6 text-center leading-none">
                    {country.flag}
                  </span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                    {country.dial}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
