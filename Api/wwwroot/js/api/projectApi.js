const BASE_URL = 'http://localhost';

function buildUrl(path, params = new URLSearchParams()) {
    const query = params.toString();
    return `${BASE_URL}${path}${query ? `?${query}` : ''}`;
}

async function requestJson(path, {
    method = 'GET',
    params = new URLSearchParams(),
    body,
    errorText = 'Request failed'
} = {}) {
    const url = buildUrl(path, params);
    const options = {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    };

    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`${errorText} (${response.status})`);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        return null;
    }

    return await response.json();
}

async function fetchJson(path, params = new URLSearchParams(), errorText = 'Request failed') {
    return requestJson(path, {
        params,
        errorText
    });
}

export async function getProject(id) {
    return fetchJson(
        `/api/projects/project/${id}`,
        new URLSearchParams(),
        'Failed to fetch project'
    );
}

export async function getAllProjects(filters = {}) {
    const params = new URLSearchParams();

    if (filters.search?.trim()) {
        params.append('Search', filters.search.trim());
    }

    if (Array.isArray(filters.tagIds)) {
        filters.tagIds.forEach((tagId) => {
            params.append('TagIds', String(tagId));
        });
    }

    if (filters.teamMemberCount != null) {
        params.append('TeamMemberCount', String(filters.teamMemberCount));
    }

    if (filters.year != null) {
        params.append('Year', String(filters.year));
    }

    if (filters.semester != null) {
        params.append('Semester', String(filters.semester));
    }
    if (filters.cookie?.metricUserId) {
        params.append('cookie.metricUserId', filters.cookie.metricUserId);
    }

    if (filters.cookie?.filterSessionId) {
        params.append('cookie.filterSessionId', filters.cookie.filterSessionId);
    }

    params.append('Page', String(filters.page ?? 1));
    params.append('PageSize', String(filters.pageSize ?? 9));

    return fetchJson(
        '/api/projects/projects',
        params,
        'Failed to fetch projects'
    );
}

export async function getTags() {
    return fetchJson(
        '/api/projects/tags',
        new URLSearchParams(),
        'Failed to fetch tags'
    );
}

export async function likeProject(id) {
    return requestJson(`/api/projects/project/${id}/like`, {
        method: 'POST',
        errorText: 'Failed to like project'
    });
}

export async function unlikeProject(id) {
    return requestJson(`/api/projects/project/${id}/like`, {
        method: 'DELETE',
        errorText: 'Failed to unlike project'
    });
}
