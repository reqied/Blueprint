import {getProject} from "./api/projectApi.js";
import {initLikeElement, toggleProjectLike} from "./likes.js";

const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isEmptyValue(value) {
    return value == null || (typeof value === "string" && value.trim() === "");
}

function isValidUrl(value) {
    if (typeof value !== "string") return false;

    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function getEmptyStateMarkup(key) {
    return `
        <div class="product-empty-state">
            <p class="product-empty-state__text">
                У этого проекта, к сожалению, нет данных о <span>${escapeHtml(key)}</span>
            </p>
            <img
                class="product-empty-state__image"
                src="resources/images/sad_bunny.svg"
                width="308"
                height="380"
                alt="Грустный кролик"
            >
        </div>
    `;
}

function renderLinksList(key, links) {
    if (!Array.isArray(links) || links.length === 0) {
        return getEmptyStateMarkup(key);
    }

    const items = links
        .map((link) => {
            const safeLink = escapeHtml(link);

            if (isValidUrl(link)) {
                return `    
                    <li>
                        <a href="${safeLink}" target="_blank" rel="noopener noreferrer">
                            ${safeLink}
                        </a>
                    </li>
                `;
            }

            return `<li>${safeLink}</li>`;
        })
        .join("");

    return `
        <ul>
            ${items}
        </ul>
    `;
}

function renderSingleValue(key, value) {
    if (isEmptyValue(value)) {
        return getEmptyStateMarkup(key);
    }

    const safeValue = escapeHtml(value);

    if (isValidUrl(value)) {
        return `
            <p>
                <a href="${safeValue}" target="_blank" rel="noopener noreferrer">
                    ${safeValue}
                </a>
            </p>
        `;
    }

    return `<p>${safeValue.replaceAll("\n", "<br>")}</p>`;
}

function generateTabs(files) {
    const container = document.getElementById("tabs-content");
    if (!container) return;

    container.querySelectorAll(".tab[data-generated='true']").forEach((tab) => tab.remove());

    if (!files || typeof files !== "object") {
        return;
    }

    Object.entries(files).forEach(([key, value]) => {
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.id = String(key).toLowerCase();
        tab.dataset.generated = "true";

        if (Array.isArray(value)) {
            tab.innerHTML = renderLinksList(key, value);
        } else {
            tab.innerHTML = renderSingleValue(key, value);
        }

        container.appendChild(tab);
    });
}

function formatTagName(tag) {
    const normalizedTag = String(tag || "").trim().toLowerCase();

    const labels = {
        python: "Python",
        csharp: "C#",
        postgresql: "PostgreSQL",
        docker: "Docker",
        javascript: "JavaScript",
        typescript: "TypeScript",
        java: "Java",
        kotlin: "Kotlin",
        go: "Go",
        php: "PHP",
        html5: "HTML5",
        css3: "CSS3",
        react: "React",
        vuejs: "Vue",
        angularjs: "Angular",
        nodejs: "Node.js",
        express: "Express",
        dotnetcore: ".NET",
        mysql: "MySQL",
        mongodb: "MongoDB",
        redis: "Redis",
        git: "Git",
        linux: "Linux"
    };

    if (labels[normalizedTag]) {
        return labels[normalizedTag];
    }

    if (!normalizedTag) {
        return "Без названия";
    }

    return normalizedTag.charAt(0).toUpperCase() + normalizedTag.slice(1);
}

function renderStack(tags) {
    const stackContainer = document.getElementById("icons");
    if (!stackContainer) return;

    stackContainer.innerHTML = "";

    if (!Array.isArray(tags) || tags.length === 0) {
        stackContainer.innerHTML = `<p class="stack-empty">Стек не указан</p>`;
        return;
    }

    tags.forEach((tag) => {
        const item = document.createElement("div");
        item.className = "icon-item";

        if (tag.icon) {
            const img = document.createElement("img");
            img.src = tag.icon;
            img.alt = tag.title || "Тег";

            if (tag.color) {
                img.style.filter = "brightness(0) saturate(100%) invert(70%)";
                img.style.boxShadow = "none";
            }

            item.appendChild(img);
        }

        const label = document.createElement("span");
        label.className = "icon-label";
        label.textContent = formatTagName(tag.title);
        item.appendChild(label);

        stackContainer.appendChild(item);
    });
}

function renderMembers(teamMembers) {
    const membersGrid = document.getElementById("members-grid");
    if (!membersGrid) return;

    const memberImages = [
        "resources/images/bow_blush.svg",
        "resources/images/sad_tear.svg",
        "resources/images/wink_star.svg",
        "resources/images/sleepy_moon.svg",
        "resources/images/sparkle_heart.svg",
        "resources/images/glasses_sad.svg"
    ];

    if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
        membersGrid.innerHTML = `<p class="stack-empty">Участники не указаны</p>`;
        return;
    }

    membersGrid.innerHTML = teamMembers
        .map((member, index) => {
            const memberName = escapeHtml(member?.userName || "Без имени");
            const avatar = memberImages[index % memberImages.length];

            return `
                <div class="member-card">
                    <img class="member-avatar" src="${avatar}" alt="Аватарка для ${memberName}">
                    <span class="member-name">${memberName}</span>
                </div>
            `;
        })
        .join("");
}

function renderProject(project) {
    const title = document.getElementById("project-title");
    const shortDescription = document.getElementById("short-description");
    const year = document.getElementById("year");
    const semester = document.getElementById("semester");
    const like = document.getElementById("project-like");

    if (title) {
        title.textContent = project?.name || "Без названия";
    }

    if (shortDescription) {
        shortDescription.textContent =
            project?.descriptionAi ||
            project?.description ||
            "";
    }

    if (year) {
        year.textContent = project?.year || "Год не указан";
    }

    if (semester) {
        semester.textContent = project?.semester || "Семестр не указан";
    }

    initLikeElement(like, project);

    renderMembers(project?.teamMembers);
    renderStack(project?.tags);
    generateTabs(project?.files);

    if (typeof window.activateTabFromHash === "function") {
        window.activateTabFromHash(false);
    }
}

function bindProjectLike() {
    const like = document.getElementById("project-like");

    if (!like) return;

    like.addEventListener("click", async (event) => {
        event.preventDefault();

        try {
            await toggleProjectLike(like, projectId);
        } catch (error) {
            console.error("Error toggling project like:", error);
        }
    });

    like.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        like.click();
    });
}

function renderProjectError() {
    const title = document.getElementById("project-title");
    const shortDescription = document.getElementById("short-description");

    if (title) {
        title.textContent = "Не удалось загрузить проект";
    }

    if (shortDescription) {
        shortDescription.textContent = "Попробуйте обновить страницу позже.";
    }
}

async function loadProject() {
    if (!projectId) {
        console.error("Project id not found in URL");
        renderProjectError();
        return;
    }

    try {
        const project = await getProject(projectId);
        renderProject(project);
    } catch (error) {
        console.error("Error loading project:", error);
        renderProjectError();
    }
}

bindProjectLike();
loadProject();