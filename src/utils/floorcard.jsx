import "swiper/css";
import "swiper/css/navigation";
import "../componentstyles/utilstyle/floorcard.css";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FiHeart, FiStar } from "react-icons/fi";

const FloorCard = ({
    id,
    image,
    floorName,
    floorNumber,
    areaSqft,
    peopleCapacity,
    numberOfRooms,
    numberOfSeats,
    amenities,
    cleaning_staff,
    studio_space,
    disposal,
    price,
    nights = 1,
    isFavorite = false,
    onFavoriteClick,
    onCardClick,
}) => {
    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        onFavoriteClick?.(id);
    };
    const handleCardClick = () => onCardClick?.(id);

    const images = Array.isArray(image) ? image : [image];

    const parseAmenities = (list) => {
        if (!list?.length) return [];
        try {
            const first = list[0];
            if (typeof first === "string" && first.startsWith("[")) return JSON.parse(first);
            return list;
        } catch { return list; }
    };
    const displayAmenities = parseAmenities(amenities);

    // const rating = 4.5;

    return (
        <article className="FloorCard_main" onClick={handleCardClick}>

            {/* GALLERY */}
            <div className="FloorCard_imageContainer">
                {images.length > 1 ? (
                    <Swiper modules={[Navigation]} navigation className="FloorCard_swiper">
                        {images.map((src, i) => (
                            <SwiperSlide key={i}>
                                <img src={src} alt={floorName} className="FloorCard_image" />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <img src={images[0]} alt={floorName} className="FloorCard_image" />
                )}

                {/* Favorite Button */}
                <button className="FloorCard_favBtn" onClick={handleFavoriteClick} aria-label="Toggle favourite">
                    <FiHeart
                        size={20}
                        strokeWidth={2}
                        stroke="white"
                        fill={isFavorite ? "#ff4d4f" : "rgba(0,0,0,0.3)"}
                    />
                </button>
            </div>

            {/* INFO SECTION */}
            <div className="FloorCard_info">

                {/* Title + Rating Row */}
                <div className="FloorCard_titleRow">
                    <h3 className="FloorCard_title">{floorName || `Floor ${floorNumber}`}</h3>
                    <div className="FloorCard_rating">
                        <FiStar size={13} fill="currentColor" />
                        <span>{rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="FloorCard_meta">
                    {[
                        areaSqft && `${areaSqft.toLocaleString()} sqft`,
                        peopleCapacity && `${peopleCapacity} people`,
                        numberOfRooms && `${numberOfRooms} rooms`,
                    ].filter(Boolean).join(" · ")}
                </div>

                {/* Price */}
                <div className="FloorCard_priceRow">
                    <span className="FloorCard_priceAmount">{price}</span>
                    <span className="FloorCard_priceNights"> for {nights} {nights === 1 ? "night" : "nights"}</span>
                    <span className="FloorCard_divider"> · </span>
                    <FiStar size={11} fill="currentColor" style={{ verticalAlign: "middle" }} />
                    <span> {rating.toFixed(1)}</span>
                </div>

            </div>
        </article>
    );
};

export default FloorCard;