import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams
} from "react-router-dom";

import { toast } from "react-toastify";

import {
    submitFeedback,
    getRequestFeedback
} from "../Services/feedbackService";

import "./Feedback.css";


function Feedback() {

    const navigate = useNavigate();

    const { requestId } = useParams();


    const [rating, setRating] =
        useState(0);

    const [comment, setComment] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [checking, setChecking] =
        useState(true);

    const [alreadySubmitted, setAlreadySubmitted] =
        useState(false);


    // =====================================================
    // CHECK EXISTING FEEDBACK
    // =====================================================

    useEffect(() => {

        checkExistingFeedback();

    }, [requestId]);


    const checkExistingFeedback = async () => {

        try {

            setChecking(true);


            const response =
                await getRequestFeedback(
                    requestId
                );


            console.log(
                "REQUEST FEEDBACK RESPONSE:",
                response
            );


            if (
                response?.status ===
                "success" &&
                response?.data
            ) {

                setAlreadySubmitted(
                    true
                );


                setRating(
                    Number(
                        response.data.rating ||
                        0
                    )
                );


                setComment(
                    response.data.comment ||
                    ""
                );

            }

        } catch (error) {

            console.error(
                "CHECK FEEDBACK ERROR:",
                error
            );

            /*
             * Don't block the page if the feedback
             * lookup fails.
             */

        } finally {

            setChecking(false);

        }
    };


    // =====================================================
    // SELECT RATING
    // =====================================================

    const handleRating = (
        selectedRating
    ) => {

        if (alreadySubmitted) {
            return;
        }


        setRating(
            selectedRating
        );
    };


    // =====================================================
    // SUBMIT FEEDBACK
    // =====================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        if (alreadySubmitted) {

            toast.info(
                "Feedback has already been submitted."
            );

            return;
        }


        if (
            rating < 1 ||
            rating > 5
        ) {

            toast.warning(
                "Please select a rating from 1 to 5 stars."
            );

            return;
        }


        try {

            setLoading(true);


            console.log(
                "SUBMITTING FEEDBACK:",
                {
                    requestId,
                    rating,
                    comment
                }
            );


            const response =
                await submitFeedback(
                    requestId,
                    rating,
                    comment.trim()
                );


            console.log(
                "SUBMIT FEEDBACK RESPONSE:",
                response
            );


            if (
                response?.status ===
                "success"
            ) {

                toast.success(
                    "Thank you! Your feedback has been submitted."
                );


                setAlreadySubmitted(
                    true
                );


                /*
                 * Give the user a moment to see
                 * the submitted state.
                 */

                setTimeout(() => {

                    navigate(
                        "/user/requests"
                    );

                }, 1200);

            } else {

                toast.error(
                    typeof response?.data ===
                    "string"
                        ? response.data
                        : "Unable to submit feedback"
                );
            }

        } catch (error) {

            console.error(
                "SUBMIT FEEDBACK ERROR:",
                error
            );


            const errorMessage =
                error?.response?.data?.data ||
                error?.response?.data ||
                error?.message ||
                "Unable to submit feedback";


            toast.error(
                typeof errorMessage ===
                "string"
                    ? errorMessage
                    : "Unable to submit feedback"
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // RATING TEXT
    // =====================================================

    const getRatingText = () => {

        switch (rating) {

            case 1:
                return "Very Poor";

            case 2:
                return "Poor";

            case 3:
                return "Average";

            case 4:
                return "Good";

            case 5:
                return "Excellent";

            default:
                return "Select your rating";
        }
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (checking) {

        return (

            <div className="feedback-page">

                <div className="feedback-container">

                    <div className="feedback-loading">

                        <div
                            className="spinner-border text-primary"
                            role="status"
                        ></div>


                        <p>
                            Loading feedback...
                        </p>

                    </div>

                </div>

            </div>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="feedback-page">

            <div className="feedback-container">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="feedback-header">

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/user/requests"
                            )
                        }
                    >

                        <i className="bi bi-arrow-left"></i>

                        My Requests

                    </button>


                    <h1>
                        Rate Your Service
                    </h1>


                    <p>
                        Share your experience with the service provider
                    </p>

                </div>


                {/* =================================================
                    CARD
                ================================================= */}

                <div className="feedback-card">


                    {alreadySubmitted ? (

                        /* ==========================================
                           ALREADY SUBMITTED
                        ========================================== */

                        <div className="feedback-success">

                            <div className="feedback-success-icon">

                                <i className="bi bi-check-circle-fill"></i>

                            </div>


                            <h2>
                                Feedback Submitted
                            </h2>


                            <p>
                                Thank you for sharing your experience.
                            </p>


                            <div className="submitted-rating">

                                {[1, 2, 3, 4, 5].map(
                                    (star) => (

                                        <i
                                            key={star}
                                            className={
                                                star <= rating
                                                    ? "bi bi-star-fill active"
                                                    : "bi bi-star"
                                            }
                                        ></i>

                                    )
                                )}

                            </div>


                            {comment && (

                                <div className="submitted-comment">

                                    <strong>
                                        Your comment
                                    </strong>


                                    <p>
                                        "{comment}"
                                    </p>

                                </div>

                            )}


                            <button
                                type="button"
                                className="btn btn-primary mt-4"
                                onClick={() =>
                                    navigate(
                                        "/user/requests"
                                    )
                                }
                            >

                                <i className="bi bi-arrow-left me-2"></i>

                                Back to My Requests

                            </button>

                        </div>

                    ) : (

                        /* ==========================================
                           FEEDBACK FORM
                        ========================================== */

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >


                            <div className="feedback-title">

                                <i className="bi bi-star-fill"></i>


                                <h2>
                                    How was your experience?
                                </h2>


                                <p>
                                    Your feedback helps us improve SmartServe.
                                </p>

                            </div>


                            {/* ======================================
                                STAR RATING
                            ====================================== */}

                            <div className="star-rating">

                                {[1, 2, 3, 4, 5].map(
                                    (star) => (

                                        <button
                                            key={star}
                                            type="button"
                                            className={
                                                star <= rating
                                                    ? "star-button selected"
                                                    : "star-button"
                                            }
                                            onClick={() =>
                                                handleRating(
                                                    star
                                                )
                                            }
                                            aria-label={
                                                `${star} star`
                                            }
                                        >

                                            <i
                                                className={
                                                    star <= rating
                                                        ? "bi bi-star-fill"
                                                        : "bi bi-star"
                                                }
                                            ></i>

                                        </button>

                                    )
                                )}

                            </div>


                            <div className="rating-text">

                                {getRatingText()}

                            </div>


                            {/* ======================================
                                COMMENT
                            ====================================== */}

                            <div className="comment-section">

                                <label
                                    htmlFor="feedback-comment"
                                >
                                    Your Feedback
                                </label>


                                <textarea
                                    id="feedback-comment"
                                    value={comment}
                                    onChange={(event) =>
                                        setComment(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Tell us about your experience with the service provider..."
                                    rows={6}
                                    maxLength={1000}
                                />


                                <div className="character-count">

                                    {comment.length}
                                    /1000

                                </div>

                            </div>


                            {/* ======================================
                                SUBMIT
                            ====================================== */}

                            <button
                                type="submit"
                                className="
                                    btn
                                    btn-primary
                                    btn-submit-feedback
                                "
                                disabled={
                                    loading ||
                                    rating === 0
                                }
                            >

                                {loading ? (

                                    <>

                                        <span
                                            className="
                                                spinner-border
                                                spinner-border-sm
                                                me-2
                                            "
                                        ></span>

                                        Submitting...

                                    </>

                                ) : (

                                    <>

                                        <i className="bi bi-send-fill me-2"></i>

                                        Submit Feedback

                                    </>

                                )}

                            </button>


                        </form>

                    )}

                </div>

            </div>

        </div>
    );
}


export default Feedback;