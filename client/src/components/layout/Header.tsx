"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { FiMenu, FiX, FiSearch, FiShoppingCart, FiPhone, FiChevronDown } from "react-icons/fi";
import { useCartStore } from "@/store";
import axios from "axios";

interface MenuItem {
  _id: string;
  label: string;
  href: string;
  submenus?: MenuItem[];
}

interface SearchResult {
  _id: string;
  name: string;
  href: string;
  image?: string;
  price?: number;
}

interface SearchResults {
  products: SearchResult[];
  brands: SearchResult[];
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMinified, setIsMinified] = useState(false);
  const lastScrollYRef = useRef(0);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storeItemCount = useCartStore((state) => state.getItemCount());
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    setItemCount(storeItemCount);
  }, [storeItemCount]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(value)}`);
        if (res.data.response === "success") {
          setSearchResults(res.data.data);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const prevScrollY = lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      if (currentScrollY <= 50) {
        setIsMinified(false);
      } else if (currentScrollY > 100 && currentScrollY > prevScrollY) {
        setIsMinified(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    axios.get("/api/menu").then((res) => {
      if (res.data.response === "success") {
        setMenuItems(res.data.data);
      }
    }).catch(() => {
      // Fallback menu if API fails
      setMenuItems([
        { _id: "1", label: "Home", href: "/" },
        { _id: "2", label: "Products", href: "/products" },
        { _id: "3", label: "Whisky", href: "/whisky" },
        { _id: "4", label: "Wine", href: "/wine" },
        { _id: "5", label: "Beer", href: "/beers" },
        { _id: "6", label: "Offers", href: "/products?onOffer=true" },
      ]);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const formatHref = (href: string) => {
    if (!href) return "/";
    if (href.startsWith("/")) return href;
    if (href.startsWith("http")) return href;
    return `/${href}`;
  };

  return (
    <header className={`sticky top-0 z-50 bg-white shadow-md transition-all duration-300 ${isMinified ? 'shadow-lg' : ''}`}>
      {/* Top Bar - Hidden when minified */}
      <div className={`bg-teal text-white text-sm overflow-hidden transition-all duration-300 ${
        isMinified ? 'max-h-0 py-0' : 'max-h-20 py-2'
      } hidden md:block`}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="tel:+254723688108" className="flex items-center gap-1 hover:text-primary-100">
              <FiPhone className="w-4 h-4" />
              <span>+254 723 688 108</span>
            </a>
            <span>Fast Delivery Across Nairobi</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-primary-100">FAQ</Link>
            <Link href="/contact" className="hover:text-primary-100">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`max-w-7xl mx-auto px-4 transition-all duration-300 ${
        isMinified ? 'py-2' : 'py-3'
      }`}>
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-primary"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>

          {/* Logo with Text - Smaller when minified */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 transition-all duration-300">
            <Image
              src="https://res.cloudinary.com/nmasuki/image/upload/c_fit,w_207,h_50/logo.png"
              alt="Dial A Drink Kenya"
              width={160}
              height={40}
              priority
              className={`w-auto transition-all duration-300 ${isMinified ? 'h-8' : 'h-10'}`}
            />
            <span className={`font-bold text-teal transition-all duration-300 hidden sm:block ${isMinified ? 'text-sm' : 'text-lg'}`}>
              Dial A Drink Kenya
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchResults && setShowResults(true)}
                placeholder="Search for drinks..."
                className={`w-full px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-all duration-300 ${
                  isMinified ? 'py-1.5 text-sm' : 'py-2'
                }`}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
              >
                {isSearching ? (
                  <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary ${isMinified ? 'w-4 h-4' : 'w-5 h-5'}`} />
                ) : (
                  <FiSearch className={`transition-all duration-300 ${isMinified ? 'w-4 h-4' : 'w-5 h-5'}`} />
                )}
              </button>

              {/* Autocomplete Dropdown */}
              {showResults && searchResults && (searchResults.products.length > 0 || searchResults.brands.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  {/* Brands */}
                  {searchResults.brands.length > 0 && (
                    <div className="p-2 border-b">
                      <p className="text-xs text-gray-500 font-semibold uppercase px-2 mb-1">Brands</p>
                      {searchResults.brands.map((brand) => (
                        <Link
                          key={brand._id}
                          href={`/products?brand=${brand.href}`}
                          onClick={() => setShowResults(false)}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          {brand.image && (
                            <Image
                              src={brand.image}
                              alt={brand.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-contain rounded"
                            />
                          )}
                          <span className="font-medium text-gray-800">{brand.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {searchResults.products.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase px-2 mb-1">Products</p>
                      {searchResults.products.map((product) => (
                        <Link
                          key={product._id}
                          href={`/products/${product.href}`}
                          onClick={() => setShowResults(false)}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-contain rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{product.name}</p>
                            {product.price && product.price > 0 && (
                              <p className="text-sm text-primary font-semibold">KES {formatPrice(product.price)}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* View All */}
                  <div className="p-2 border-t bg-gray-50">
                    <button
                      type="submit"
                      className="w-full text-center py-2 text-sm text-primary hover:text-primary-600 font-medium"
                    >
                      View all results for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary">
            <FiShoppingCart className={`transition-all duration-300 ${isMinified ? 'w-5 h-5' : 'w-6 h-6'}`} />
            {itemCount > 0 && (
              <span className={`absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full flex items-center justify-center transition-all duration-300 ${
                isMinified ? 'w-4 h-4 text-[10px]' : 'w-5 h-5'
              }`}>
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop Navigation with Submenus - Smaller when minified */}
      <nav className={`hidden lg:block bg-gray-50 border-t transition-all duration-300 ${
        isMinified ? 'py-0' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1 py-0">
            {menuItems.slice(0, 10).map((item) => (
              <li
                key={item._id}
                className="relative group"
                onMouseEnter={() => setActiveMenu(item._id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  href={formatHref(item.href)}
                  className={`flex items-center gap-1 px-4 text-gray-700 hover:text-primary hover:bg-gray-100 font-medium uppercase transition-all duration-300 ${
                    isMinified ? 'py-2 text-xs' : 'py-3 text-sm'
                  }`}
                >
                  {item.label}
                  {item.submenus && item.submenus.length > 0 && (
                    <FiChevronDown className={`transition-all duration-300 ${isMinified ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  )}
                </Link>

                {/* Submenu Dropdown */}
                {item.submenus && item.submenus.length > 0 && activeMenu === item._id && (
                  <div className="absolute left-0 top-full bg-white shadow-lg rounded-b-lg min-w-[200px] z-50 border-t-2 border-primary">
                    <ul className="py-2">
                      {item.submenus.map((sub) => (
                        <li key={sub._id}>
                          <Link
                            href={formatHref(sub.href)}
                            className="block px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 capitalize transition-colors"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="lg:hidden bg-white border-t max-h-[70vh] overflow-y-auto">
          <ul className="py-4">
            {menuItems.map((item) => (
              <li key={item._id}>
                <Link
                  href={formatHref(item.href)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:text-primary font-medium"
                >
                  {item.label}
                </Link>
                {item.submenus && item.submenus.length > 0 && (
                  <ul className="pl-6 bg-gray-50">
                    {item.submenus.map((sub) => (
                      <li key={sub._id}>
                        <Link
                          href={formatHref(sub.href)}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2 text-gray-600 hover:text-primary text-sm"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
