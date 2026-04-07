"use client";

import { useState } from "react";
import { Star, LogIn, ShieldCheck } from "lucide-react";

type Review = {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Props = {
  slug: string;
  isLoggedIn: boolean;
  canReview: boolean;
  initialReviews: Review[];
};

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const sz = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star`}
        >
          <Star
            className={`${sz} transition-colors ${
              n <= active ? "fill-primary text-primary" : "fill-muted text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function ReviewsSection({ slug, isLoggedIn, canReview, initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    if (!name.trim()) { setError("Please enter your name"); return; }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reviewer_name: name.trim(), rating, comment: comment.trim() || undefined }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      // Optimistically add to list
      const newReview: Review = {
        id: crypto.randomUUID(),
        reviewer_name: name.trim(),
        rating,
        comment: comment.trim() || null,
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setSuccess(true);
      setShowForm(false);
      setName("");
      setRating(0);
      setComment("");
    } catch {
      setError("Network error — please try again");
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Reviews</h2>
          {avgRating !== null && (
            <div className="flex items-center gap-1.5">
              <StarRating value={Math.round(avgRating)} size="sm" />
              <span className="text-sm font-semibold text-primary">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({reviews.length})
              </span>
            </div>
          )}
        </div>
        {!showForm && !success && canReview && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Write a review
          </button>
        )}
      </div>

      {/* Eligibility notices — only shown when form is not open and review not yet submitted */}
      {!showForm && !success && !canReview && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          {!isLoggedIn ? (
            <>
              <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 text-sm text-muted-foreground">
                <a href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </a>{" "}
                and visit this shop to leave a review.
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only customers who have visited this shop can leave a review.
              </p>
            </>
          )}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          Thank you for your review!
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <form
          onSubmit={(e) => { void handleSubmit(e); }}
          className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4"
        >
          <p className="font-medium">Your Review</p>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Star picker */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Rating <span className="text-destructive">*</span>
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="review-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Your name <span className="text-destructive">*</span>
            </label>
            <input
              id="review-name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmad"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
            />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Comment <span className="text-muted-foreground/50 font-normal">(optional)</span>
            </label>
            <textarea
              id="review-comment"
              maxLength={1000}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience…"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition resize-none"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground/50">{comment.length}/1000</p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No reviews yet — be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {getInitials(review.reviewer_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="font-medium text-sm">{review.reviewer_name}</p>
                    <span className="text-xs text-muted-foreground">{timeAgo(review.created_at)}</span>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                  {review.comment && (
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
