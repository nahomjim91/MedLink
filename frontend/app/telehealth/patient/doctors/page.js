"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Heart,
  Star,
  Filter,
  X,
  ChevronDown,
  Search,
  Loader2,
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { Button, IconButton } from "../../components/ui/Button";
import {
  GET_DOCTORS_BY_SPECIALIZATION,
  GET_ALL_DOCTORS,
  SEARCH_DOCTORS,
  FILTER_DOCTORS,
  GET_DOCTOR_SPECIALIZATIONS,
} from "../../api/graphql/queries";
import Link from "next/link";

// Updated DoctorCard component to work with user field instead of displayName

const DoctorCard = ({ doctor, onFavoriteClick }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteClick = () => {
    setIsFavorited(!isFavorited);
    onFavoriteClick(doctor.doctorId);
  };

  // Get display name from user field
  const getDisplayName = (doctor) => {
    if (doctor.user?.firstName && doctor.user?.lastName) {
      return `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
    }
    if (doctor.user?.firstName) {
      return `Dr. ${doctor.user.firstName}`;
    }
    return "Dr. Unknown";
  };

  // Extract initials from user name
  const getInitials = (doctor) => {
    if (doctor.user?.firstName && doctor.user?.lastName) {
      return doctor.user.firstName.charAt(0) + doctor.user.lastName.charAt(0);
    }
    if (doctor.user?.firstName) {
      return doctor.user.firstName.charAt(0) + doctor.user.firstName.charAt(1);
    }
    return "DR";
  };

  // Get profile image from user field
  const getProfileImage = (doctor) => {
    return doctor.user?.profileImageUrl;
  };

  // Get gender from user field
  const getGender = (doctor) => {
    return doctor.user?.gender;
  };

  const displayName = getDisplayName(doctor);
  const initials = getInitials(doctor);
  const profileImage = getProfileImage(doctor);

  return (
    <Link href={`/telehealth/patient/doctors/${doctor.doctorId}`}>
      
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {initials}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleFavoriteClick}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorited ? "fill-primary text-primary" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {displayName}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#25C8B1] text-[#25C8B1]" />
            <span className="text-[#25C8B1] font-medium text-sm">
              {doctor.averageRating ? doctor.averageRating.toFixed(1) : "3.5"}
            </span>
            {doctor.ratingCount > 0 && (
              <span className="text-gray-400 text-xs">
                ({doctor.ratingCount})
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-2">
          {Array.isArray(doctor.specialization)
            ? doctor.specialization.join(", ")
            : doctor.specialization || "General Practitioner"}
        </p>
        <p className="text-gray-400 text-xs mb-3">
          {doctor.experienceYears}+ years experience
        </p>
        {doctor.pricePerSession && (
          <p className="text-[#25C8B1] font-bold text-xl">
            ${doctor.pricePerSession}
          </p>
        )}
      </div>
    </div>
    </Link>
  );
};

const FilterModal = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  specializations = [],
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      specializations: [],
      minRating: 0,
      maxPrice: 200,
      minExperience: 0,
      gender: "",
    };
    setLocalFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Specialist Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Specializations
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {specializations.map((specialist) => (
                  <button
                    key={specialist}
                    onClick={() => {
                      const newSpecs = localFilters.specializations.includes(
                        specialist
                      )
                        ? localFilters.specializations.filter(
                            (s) => s !== specialist
                          )
                        : [...localFilters.specializations, specialist];
                      setLocalFilters({
                        ...localFilters,
                        specializations: newSpecs,
                      });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      localFilters.specializations.includes(specialist)
                        ? "bg-[#25C8B1] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {specialist}
                  </button>
                ))}
              </div>
              {localFilters.specializations.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {localFilters.specializations.length} selected
                </p>
              )}
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gender
              </label>
              <div className="flex gap-2">
                {["", "Male", "Female"].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setLocalFilters({ ...localFilters, gender })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      localFilters.gender === gender
                        ? "bg-[#25C8B1] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {gender || "Any"}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Minimum Rating: {localFilters.minRating}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={localFilters.minRating}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minRating: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #25C8B1 0%, #25C8B1 ${
                    (localFilters.minRating / 5) * 100
                  }%, #e5e7eb ${
                    (localFilters.minRating / 5) * 100
                  }%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>5</span>
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Maximum Price: ${localFilters.maxPrice}
              </label>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={localFilters.maxPrice}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxPrice: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #25C8B1 0%, #25C8B1 ${
                    (localFilters.maxPrice / 200) * 100
                  }%, #e5e7eb ${
                    (localFilters.maxPrice / 200) * 100
                  }%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$200</span>
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Minimum Experience: {localFilters.minExperience} years
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={localFilters.minExperience}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minExperience: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #25C8B1 0%, #25C8B1 ${
                    (localFilters.minExperience / 30) * 100
                  }%, #e5e7eb ${
                    (localFilters.minExperience / 30) * 100
                  }%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>30+</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={handleResetFilters}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex-1 py-3 px-4 bg-[#25C8B1] text-white rounded-xl font-medium hover:bg-[#20B5A3] transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DoctorListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSpecialization, setActiveSpecialization] = useState("");
  const [filters, setFilters] = useState({
    specializations: [],
    minRating: 0,
    maxPrice: 200,
    minExperience: 0,
    gender: "",
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 12;

  // Get specializations
  const { data: specializationsData, loading: specializationsLoading, error: specializationsError } = useQuery(GET_DOCTOR_SPECIALIZATIONS);

  // Main query logic
  const shouldUseSearch = searchTerm.trim() !== "";
  const shouldUseFilter =
    filters.specializations.length > 0 ||
    filters.minRating > 0 ||
    filters.maxPrice < 200 ||
    filters.minExperience > 0 ||
    filters.gender !== "";

  // Search query
  const {
    data: searchData,
    loading: searchLoading,
    error: searchError,
  } = useQuery(SEARCH_DOCTORS, {
    variables: {
      input: {
        searchTerm: searchTerm.trim(),
        specialization: activeSpecialization
          ? [activeSpecialization]
          : undefined,
        sortBy: "rating",
        sortOrder: "desc",
      },
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
    },
    skip: !shouldUseSearch,
    fetchPolicy: "cache-and-network",
  });

  // Filter query
  const {
    data: filterData,
    loading: filterLoading,
    error: filterError,
  } = useQuery(FILTER_DOCTORS, {
    variables: {
      filter: {
        specializations:
          filters.specializations.length > 0
            ? filters.specializations
            : undefined,
        rating: filters.minRating > 0 ? filters.minRating : undefined,
        priceRange:
          filters.maxPrice < 200 ? { max: filters.maxPrice } : undefined,
        experienceRange:
          filters.minExperience > 0
            ? { min: filters.minExperience }
            : undefined,
        gender: filters.gender || undefined,
      },
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
    },
    skip: !shouldUseFilter,
    fetchPolicy: "cache-and-network",
  });

  // Specialization query
  const {
    data: specializationData,
    loading: specializationLoading,
    error: specializationError,
  } = useQuery(GET_DOCTORS_BY_SPECIALIZATION, {
    variables: { specialization: activeSpecialization },
    skip: !activeSpecialization || shouldUseSearch || shouldUseFilter,
    fetchPolicy: "cache-and-network",
  });

  // All doctors query (fallback)
  const {
    data: allDoctorsData,
    loading: allDoctorsLoading,
    error: allDoctorsError,
  } = useQuery(GET_ALL_DOCTORS, {
    variables: {
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
    },
    skip: shouldUseSearch || shouldUseFilter || activeSpecialization,
    fetchPolicy: "cache-and-network",
  });

  // Determine which data to use
  const getDoctorsData = () => {
    if (shouldUseSearch && searchData) {
      return {
        doctors: searchData.searchDoctors?.doctors || [],
        totalCount: searchData.searchDoctors?.totalCount || 0,
        hasMore: searchData.searchDoctors?.hasMore || false,
      };
    }
    if (shouldUseFilter && filterData) {
      return {
        doctors: filterData.filterDoctors?.doctors || [],
        totalCount: filterData.filterDoctors?.totalCount || 0,
        hasMore: filterData.filterDoctors?.hasMore || false,
      };
    }
    if (activeSpecialization && specializationData) {
      const doctors = specializationData.doctorsBySpecialization || [];
      return {
        doctors,
        totalCount: doctors.length,
        hasMore: false,
      };
    }
    if (allDoctorsData) {
      const doctors = allDoctorsData.allDoctors || [];
      return {
        doctors,
        totalCount: doctors.length,
        hasMore: doctors.length === ITEMS_PER_PAGE,
      };
    }
    return { doctors: [], totalCount: 0, hasMore: false };
  };

  const { doctors, totalCount, hasMore } = getDoctorsData();

  // Debug logging
  console.log("=== DOCTOR LISTING DEBUG ===");
  console.log("shouldUseSearch:", shouldUseSearch);
  console.log("shouldUseFilter:", shouldUseFilter);
  console.log("activeSpecialization:", activeSpecialization);
  console.log("searchData:", searchData);
  console.log("filterData:", filterData);
  console.log("specializationData:", specializationData);
  console.log("allDoctorsData:", allDoctorsData);
  console.log("Final doctors array:", doctors);
  console.log("Final totalCount:", totalCount);

  const loading =
    searchLoading ||
    filterLoading ||
    specializationLoading ||
    allDoctorsLoading;
  const error =
    searchError || filterError || specializationError || allDoctorsError;

  const handleFavoriteClick = (doctorId) => {
    console.log(`Favorited doctor with ID: ${doctorId}`);
    // Implement favorite functionality
  };

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  }, []);

  const handleSpecializationClick = (specialization) => {
    setActiveSpecialization(
      specialization === activeSpecialization ? "" : specialization
    );
    setCurrentPage(0);
    setSearchTerm("");
    setFilters({
      specializations: [],
      minRating: 0,
      maxPrice: 200,
      minExperience: 0,
      gender: "",
    });
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
    setActiveSpecialization("");
    setSearchTerm("");
  };

  const specializations = specializationsData?.getDoctorSpecializations || [];

  const SpecialistButtons = () => {
    const scrollRef = useRef(null);

    return (
      <div className="flex justify-end">
        <div ref={scrollRef} className="mb-3 w-2/3 overflow-x-auto rounded-md">
          <div className="flex w-max gap-3 px-4 justify-end">
            {specializations.map((specialist) => (
              <Button
                key={specialist}
                variant={activeSpecialization === specialist ? "" : "outline"}
                onClick={() => handleSpecializationClick(specialist)}
                className={`min-w-max px-6 py-3 rounded-full font-medium transition-colors ${
                  activeSpecialization === specialist
                    ? "bg-[#25C8B1] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {specialist}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    console.error("GraphQL Error:", error);
    return (
      <div className="h-[89vh] bg-gray-50 p-2 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Error loading doctors
          </h3>
          <p className="text-gray-500">
            {error.message || "Something went wrong. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[89vh] bg-gray-50 p-2 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md: md:justify-between">
          {/* Search + Filter Section */}
          <div className="flex flex-row gap-4 w-full">
            {/* Search Input */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-primary/70" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search doctors, specializations..."
                className="pl-10 pr-4 py-2 w-full bg-background/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
              className="hidden md:flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 w-full sm:w-auto"
            >
              <Filter size={16} />
              <span>Filters</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isFilterModalOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
            <div className="md:hidden flex items-center gap-2">
              <IconButton
                onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                icon={<Filter size={20} className="text-primary" />}
                variant="outline"
                className="md:hidden"
              />
            </div>
          </div>

          {/* Results Count */}
          <p className="text-gray-600 text-sm sm:text-base text-center md:text-left">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                Result Found: {totalCount} doctor{totalCount !== 1 ? "s" : ""}
                {activeSpecialization && (
                  <span className="text-primary ml-2">
                    • {activeSpecialization}
                  </span>
                )}
                {searchTerm && (
                  <span className="text-primary ml-2">
                    • &quot;{searchTerm}&quot;
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Specialist Tags */}
        <SpecialistButtons />

        {/* Doctor Grid */}
        {doctors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-[67vh] overflow-y-auto mt-2">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.doctorId}
                doctor={doctor}
                onFavoriteClick={handleFavoriteClick}
              />
            ))}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-[67vh] overflow-y-auto mt-2">
            {Array(8)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-200 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* No Results */}
        {!loading && doctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No doctors found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || activeSpecialization || shouldUseFilter
                ? "Try adjusting your search or filters to see more results"
                : "No doctors available at the moment"}
            </p>
            {(searchTerm || activeSpecialization || shouldUseFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setActiveSpecialization("");
                  setFilters({
                    specializations: [],
                    minRating: 0,
                    maxPrice: 200,
                    minExperience: 0,
                    gender: "",
                  });
                  setCurrentPage(0);
                }}
                className="px-6 py-2 bg-[#25C8B1] text-white rounded-xl hover:bg-[#20B5A3] transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && doctors.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-6 py-2 bg-[#25C8B1] text-white rounded-xl hover:bg-[#20B5A3] transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        specializations={specializations}
      />
    </div>
  );
};

export default DoctorListing;