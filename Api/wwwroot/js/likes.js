import {likeProject, unlikeProject} from "./api/projectApi.js";

const LIKE_COUNT_KEYS = ["likesCount", "likeCount", "likes", "likesAmount", "projectLikesCount"];
const IS_LIKED_KEYS = ["isLiked", "liked", "hasLike", "isUserLiked", "likedByCurrentUser"];

function findFirstValue(source, keys) {
    return keys
        .map((key) => source?.[key])
        .find((value) => value != null);
}

export function getProjectLikeState(project, fallback = { likesCount: 0, isLiked: false }) {
    const rawLikesCount = findFirstValue(project, LIKE_COUNT_KEYS);
    const rawIsLiked = findFirstValue(project, IS_LIKED_KEYS);
    const likesCount = Number(rawLikesCount ?? fallback.likesCount);

    return {
        likesCount: Number.isFinite(likesCount) ? likesCount : fallback.likesCount,
        isLiked: rawIsLiked == null ? fallback.isLiked : Boolean(rawIsLiked)
    };
}

function updateLikeElement(element, state) {
    if (!element) return;

    const count = Math.max(Number(state.likesCount) || 0, 0);
    const liked = Boolean(state.isLiked);

    element.classList.toggle("like--active", liked);
    element.setAttribute("aria-pressed", String(liked));
    element.setAttribute("aria-label", liked ? "Убрать лайк" : "Поставить лайк");

    const counter = element.querySelector(".like-count");
    if (counter) {
        counter.textContent = String(count);
    }
}

export function initLikeElement(element, project) {
    if (!element) return;

    updateLikeElement(element, getProjectLikeState(project));
}

export async function toggleProjectLike(element, projectId) {
    if (!element || !projectId || element.classList.contains("like--loading")) return;

    const wasLiked = element.classList.contains("like--active");
    const counter = element.querySelector(".like-count");
    const currentCount = Number(counter?.textContent) || 0;
    const optimisticState = {
        isLiked: !wasLiked,
        likesCount: currentCount + (wasLiked ? -1 : 1)
    };

    element.classList.add("like--loading");
    updateLikeElement(element, optimisticState);

    try {
        const result = wasLiked
            ? await unlikeProject(projectId)
            : await likeProject(projectId);

        updateLikeElement(element, getProjectLikeState(result, optimisticState));
    } catch (error) {
        updateLikeElement(element, {
            isLiked: wasLiked,
            likesCount: currentCount
        });

        throw error;
    } finally {
        element.classList.remove("like--loading");
    }
}
