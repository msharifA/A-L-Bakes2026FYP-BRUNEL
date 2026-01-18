import { useEffect, useState } from "react";
import { getProductReviews } from "../api/reviews";

function StarRating({ rating }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ color: star <= rating ? "#F5A623" : "#E8E3DD", fontSize: "1.2em" }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    loadReviews();
  }, [productId, sort]);

  async function loadReviews() {
    try {
      setLoading(true);
      const data = await getProductReviews(productId, { sort });
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: "20px 0" }}><div className="spinner"></div> Loading reviews...</div>;

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: 8 }}>Customer Reviews</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StarRating rating={Math.round(avgRating)} />
            <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
              {avgRating.toFixed(1)} out of 5 ({total} {total === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: "10px 14px" }}
        >
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="card"
              style={{
                padding: 20,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                    {review.customer_name}
                  </div>
                  {review.verified_purchase && (
                    <span className="badge badge-success" style={{ fontSize: 11 }}>
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <StarRating rating={review.rating} />
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
                    {new Date(review.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </div>
                </div>
              </div>

              <p style={{ margin: 0, lineHeight: 1.6, color: "var(--color-text)" }}>
                {review.review_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
