const API_BASE_URL = "http://127.0.0.1:8000";


/* =========================================================
   COMMON FUNCTIONS
========================================================= */

function showMessage(elementId, message, type) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;

    element.className =
        "form-message show " + type;
}


function clearMessage(elementId) {

    const element =
        document.getElementById(elementId);

    if (!element) return;

    element.textContent = "";

    element.className = "form-message";
}


function getToken() {

    return localStorage.getItem("access_token");

}


function getUser() {

    const user =
        localStorage.getItem("user");

    if (!user) return null;

    try {

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "User data error:",
            error
        );

        return null;
    }
}


function logoutUser() {

    localStorage.removeItem("access_token");

    localStorage.removeItem("user");

    localStorage.removeItem("latest_estimation");

    localStorage.removeItem("latest_project");

    window.location.href = "login.html";
}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   SIGNUP
========================================================= */

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            clearMessage(
                "signupMessage"
            );


            const fullName =
                document
                    .getElementById("fullName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const confirmPasswordElement =
                document.getElementById(
                    "confirmPassword"
                );


            const confirmPassword =
                confirmPasswordElement
                    ? confirmPasswordElement.value
                    : password;


            if (
                !fullName ||
                !email ||
                !password
            ) {

                showMessage(
                    "signupMessage",
                    "Please fill all required fields.",
                    "error"
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    "signupMessage",
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            if (password.length < 6) {

                showMessage(
                    "signupMessage",
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;
            }


            const button =
                signupForm.querySelector(
                    'button[type="submit"]'
                );


            button.disabled = true;

            button.textContent =
                "Creating Account...";


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/signup`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                full_name:
                                    fullName,

                                email:
                                    email,

                                password:
                                    password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        "signupMessage",
                        data.detail ||
                        "Unable to create account.",
                        "error"
                    );

                    return;
                }


                showMessage(
                    "signupMessage",
                    "Account created successfully. Redirecting to login...",
                    "success"
                );


                setTimeout(
                    function() {

                        window.location.href =
                            "login.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "SIGNUP ERROR:",
                    error
                );


                showMessage(
                    "signupMessage",
                    "Unable to connect to the backend server.",
                    "error"
                );


            } finally {

                button.disabled = false;

                button.textContent =
                    "Create Account";
            }

        }
    );
}


/* =========================================================
   LOGIN
========================================================= */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            clearMessage(
                "loginMessage"
            );


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            if (!email || !password) {

                showMessage(
                    "loginMessage",
                    "Please enter email and password.",
                    "error"
                );

                return;
            }


            const button =
                loginForm.querySelector(
                    'button[type="submit"]'
                );


            button.disabled = true;

            button.textContent =
                "Signing In...";


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email:
                                    email,

                                password:
                                    password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        "loginMessage",
                        data.detail ||
                        "Invalid email or password.",
                        "error"
                    );

                    return;
                }


                if (!data.access_token) {

                    showMessage(
                        "loginMessage",
                        "Login successful, but access token was not received.",
                        "error"
                    );

                    return;
                }


                localStorage.setItem(
                    "access_token",
                    data.access_token
                );


                if (data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            data.user
                        )
                    );
                }


                showMessage(
                    "loginMessage",
                    "Login successful. Redirecting...",
                    "success"
                );


                setTimeout(
                    function() {

                        window.location.href =
                            "dashboard.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                showMessage(
                    "loginMessage",
                    "Unable to connect to the backend server. Make sure the backend is running.",
                    "error"
                );


            } finally {

                button.disabled = false;

                button.textContent =
                    "Sign In";
            }

        }
    );
}


/* =========================================================
   NEW PROJECT
========================================================= */

const projectForm =
    document.getElementById(
        "projectForm"
    );


if (projectForm) {

    projectForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            clearMessage(
                "projectMessage"
            );


            const token =
                getToken();


            if (!token) {

                window.location.href =
                    "login.html";

                return;
            }


            /* -----------------------------------------
               GET FORM VALUES
            ----------------------------------------- */

            const projectName =
                document
                    .getElementById(
                        "projectName"
                    )
                    .value
                    .trim();


            const constructionType =
                document
                    .getElementById(
                        "constructionType"
                    )
                    .value;


            const location =
                document
                    .getElementById(
                        "location"
                    )
                    .value
                    .trim();


            const state =
                document
                    .getElementById(
                        "state"
                    )
                    .value
                    .trim();


            const builtUpArea =
                Number(
                    document
                        .getElementById(
                            "builtUpArea"
                        )
                        .value
                );


            const floors =
                Number(
                    document
                        .getElementById(
                            "floors"
                        )
                        .value
                );


            const rooms =
                Number(
                    document
                        .getElementById(
                            "rooms"
                        )
                        .value
                );


            const duration =
                Number(
                    document
                        .getElementById(
                            "duration"
                        )
                        .value
                );


            const qualityElement =
                document.querySelector(
                    'input[name="quality"]:checked'
                );


            const quality =
                qualityElement
                    ? qualityElement.value
                    : "standard";


            const structure =
                document
                    .getElementById(
                        "structure"
                    )
                    .value;


            const materialGrade =
                document
                    .getElementById(
                        "materialGrade"
                    )
                    .value;


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (
                !projectName ||
                !constructionType ||
                !location ||
                !state ||
                !builtUpArea ||
                !floors ||
                !rooms ||
                !duration ||
                !structure ||
                !materialGrade
            ) {

                showMessage(
                    "projectMessage",
                    "Please fill all project details.",
                    "error"
                );

                return;
            }


            /* -----------------------------------------
               BUTTON
            ----------------------------------------- */

            const button =
                projectForm.querySelector(
                    'button[type="submit"]'
                );


            button.disabled = true;

            button.innerHTML =
                "<span>Creating project...</span><strong>...</strong>";


            try {

                /* =====================================
                   STEP 1 — CREATE PROJECT
                ===================================== */

                const projectResponse =
                    await fetch(
                        `${API_BASE_URL}/api/projects`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                project_name:
                                    projectName,

                                construction_type:
                                    constructionType,

                                location:
                                    location,

                                state:
                                    state,

                                built_up_area:
                                    builtUpArea,

                                floors:
                                    floors,

                                rooms:
                                    rooms,

                                duration_months:
                                    duration,

                                quality:
                                    quality,

                                structure_type:
                                    structure,

                                material_grade:
                                    materialGrade
                            })
                        }
                    );


                const projectData =
                    await projectResponse.json();


                console.log(
                    "PROJECT RESPONSE:",
                    projectData
                );


                if (!projectResponse.ok) {

                    if (
                        projectResponse.status ===
                        401
                    ) {

                        logoutUser();

                        return;
                    }


                    throw new Error(
                        projectData.detail ||
                        "Unable to create project."
                    );
                }


                /* =====================================
                   IMPORTANT FIX

                   Backend returns:

                   {
                       message: "...",
                       project: {...}
                   }

                   Therefore use:

                   projectData.project
                ===================================== */

                const project =
                    projectData.project;


                if (
                    !project ||
                    !project.id
                ) {

                    throw new Error(
                        "Project was created, but project ID was not received."
                    );
                }


                console.log(
                    "CREATED PROJECT:",
                    project
                );


                /* =====================================
                   SAVE PROJECT IMMEDIATELY
                ===================================== */

                localStorage.setItem(
                    "latest_project",
                    JSON.stringify(
                        project
                    )
                );


                /* =====================================
                   STEP 2 — GENERATE ESTIMATION
                ===================================== */

                button.innerHTML =
                    "<span>Calculating estimate...</span><strong>...</strong>";


                const estimationResponse =
                    await fetch(
                        `${API_BASE_URL}/api/estimation`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                project_id:
                                    project.id

                            })
                        }
                    );


                const estimationData =
                    await estimationResponse.json();


                console.log(
                    "ESTIMATION RESPONSE:",
                    estimationData
                );


                if (
                    !estimationResponse.ok
                ) {

                    throw new Error(
                        estimationData.detail ||
                        "Project created but estimation failed."
                    );
                }


                /* =====================================
                   VALIDATE ESTIMATION RESPONSE
                ===================================== */

                if (
                    !estimationData.project ||
                    !estimationData.estimation
                ) {

                    throw new Error(
                        "Invalid estimation response received from server."
                    );
                }


                /* =====================================
                   SAVE COMPLETE ESTIMATION
                ===================================== */

                localStorage.setItem(
                    "latest_estimation",
                    JSON.stringify(
                        estimationData
                    )
                );


                localStorage.setItem(
                    "latest_project",
                    JSON.stringify(
                        estimationData.project
                    )
                );


                /* =====================================
                   SUCCESS
                ===================================== */

                showMessage(
                    "projectMessage",
                    "Project created successfully. Opening estimate...",
                    "success"
                );


                button.innerHTML =
                    "<span>Estimate ready</span><strong>✓</strong>";


                /* =====================================
                   REDIRECT
                ===================================== */

                setTimeout(
                    function() {

                        window.location.href =
                            "estimation.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "PROJECT / ESTIMATION ERROR:",
                    error
                );


                showMessage(
                    "projectMessage",
                    error.message ||
                    "Something went wrong while creating the estimate.",
                    "error"
                );


                button.disabled = false;

                button.innerHTML =
                    "<span>Generate estimate</span><strong>→</strong>";

            }

        }
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboardProjects() {

    const projectsContainer =
        document.getElementById(
            "projectsContainer"
        );


    if (!projectsContainer) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/projects`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status ===
            401
        ) {

            logoutUser();

            return;
        }


        const data =
            await response.json();


        console.log(
            "DASHBOARD PROJECTS RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load projects."
            );
        }


        /* =====================================
           IMPORTANT FIX

           Backend returns:

           {
               "projects": [...]
           }

           So pass data.projects
        ===================================== */

        displayProjects(
            data.projects || []
        );


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        projectsContainer.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load projects</h3>
                <p>${escapeHTML(
                    error.message
                )}</p>
            </div>
        `;
    }
}


/* =========================================================
   DISPLAY PROJECTS
========================================================= */

function displayProjects(
    projects
) {

    const container =
        document.getElementById(
            "projectsContainer"
        );


    if (!container) {
        return;
    }


    const totalProjectsElement =
        document.getElementById(
            "totalProjects"
        );


    if (totalProjectsElement) {

        totalProjectsElement.textContent =
            projects.length;
    }


    if (
        !projects ||
        projects.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    +
                </div>

                <h3>
                    No projects yet
                </h3>

                <p>
                    Create your first construction
                    project to generate an estimate.
                </p>

                <a
                    href="new-project.html"
                    class="btn btn-primary"
                >
                    Create first project
                </a>

            </div>
        `;

        return;
    }


    container.innerHTML =
        projects.map(
            function(project) {

                return `

                    <div class="project-card">

                        <div class="project-card-header">

                            <h3>
                                ${escapeHTML(
                                    project.project_name
                                )}
                            </h3>

                            <span class="project-status">
                                Active
                            </span>

                        </div>


                        <div class="project-card-details">

                            <p>
                                <strong>Location:</strong>
                                ${escapeHTML(
                                    project.location
                                )}
                            </p>

                            <p>
                                <strong>Area:</strong>
                                ${Number(
                                    project.built_up_area
                                ).toLocaleString()}
                                sq.ft
                            </p>

                            <p>
                                <strong>Floors:</strong>
                                ${project.floors}
                            </p>

                            <p>
                                <strong>Quality:</strong>
                                ${escapeHTML(
                                    project.quality
                                )}
                            </p>

                        </div>


                        <div class="project-card-actions">

                            <button
                                class="btn btn-primary"
                                onclick="openProject(${project.id})"
                            >
                                View Estimate
                            </button>

                            <button
                                class="btn btn-secondary"
                                onclick="deleteProject(${project.id})"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `;
            }
        )
        .join("");
}


/* =========================================================
   OPEN PROJECT
========================================================= */

async function openProject(
    projectId
) {

    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/estimation/${projectId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "OPEN ESTIMATION:",
            data
        );


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to load estimate."
            );

            return;
        }


        /* SAVE COMPLETE RESPONSE */

        localStorage.setItem(
            "latest_estimation",
            JSON.stringify(
                data
            )
        );


        localStorage.setItem(
            "latest_project",
            JSON.stringify(
                data.project
            )
        );


        window.location.href =
            "estimation.html";


    } catch (error) {

        console.error(
            "OPEN PROJECT ERROR:",
            error
        );


        alert(
            "Unable to connect to backend."
        );
    }
}


/* =========================================================
   DELETE PROJECT
========================================================= */

async function deleteProject(
    projectId
) {

    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this project?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/projects/${projectId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to delete project."
            );

            return;
        }


        loadDashboardProjects();


    } catch (error) {

        console.error(
            "DELETE PROJECT ERROR:",
            error
        );


        alert(
            "Unable to connect to backend."
        );
    }
}


/* =========================================================
   USER INFORMATION
========================================================= */

function loadUserInformation() {

    const user =
        getUser();


    if (!user) {
        return;
    }


    const nameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    nameElements.forEach(
        function(element) {

            element.textContent =
                user.full_name ||
                "User";
        }
    );


    const emailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    emailElements.forEach(
        function(element) {

            element.textContent =
                user.email ||
                "";
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButtons =
    document.querySelectorAll(
        "[data-logout]"
    );


logoutButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                logoutUser();
            }
        );
    }
);


/* =========================================================
   ESTIMATION PAGE
========================================================= */

function loadEstimationPage() {

    const estimateProjectName =
        document.getElementById(
            "estimateProjectName"
        );


    if (!estimateProjectName) {
        return;
    }


    const raw =
        localStorage.getItem(
            "latest_estimation"
        );


    if (!raw) {

        estimateProjectName.textContent =
            "No estimate";

        return;
    }


    try {

        const data =
            JSON.parse(raw);


        const project =
            data.project || {};


        const estimation =
            data.estimation || {};


        const breakdown =
            estimation.cost_breakdown ||
            {};


        const materials =
            estimation.materials ||
            {};


        function setText(
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    value;
            }
        }


        /* =====================================
           PROJECT
        ===================================== */

        setText(
            "estimateProjectName",
            project.project_name ||
            "—"
        );


        setText(
            "estimateArea",
            project.built_up_area
                ? Number(
                    project.built_up_area
                ).toLocaleString()
                : "—"
        );


        setText(
            "estimateRate",
            estimation.rate_per_sqft !==
            undefined
                ? `₹${Number(
                    estimation.rate_per_sqft
                ).toLocaleString(
                    "en-IN"
                )}`
                : "—"
        );


        setText(
            "estimateTotal",
            estimation.total_cost !==
            undefined
                ? `₹${Number(
                    estimation.total_cost
                ).toLocaleString(
                    "en-IN"
                )}`
                : "—"
        );


        /* =====================================
           BUDGET RANGE
        ===================================== */

        if (
            estimation.budget_range
        ) {

            setText(
                "minimumCost",
                `₹${Number(
                    estimation.budget_range.minimum
                ).toLocaleString(
                    "en-IN"
                )}`
            );


            setText(
                "maximumCost",
                `₹${Number(
                    estimation.budget_range.maximum
                ).toLocaleString(
                    "en-IN"
                )}`
            );
        }


        /* =====================================
           COST BREAKDOWN

           Backend names:
           materials
           labour
           electrical_plumbing
           finishing
           contingency
        ===================================== */

        setText(
            "materialCost",
            breakdown.materials !==
            undefined
                ? `₹${Number(
                    breakdown.materials
                ).toLocaleString(
                    "en-IN"
                )}`
                : "—"
        );


        setText(
            "labourCost",
            breakdown.labour !==
            undefined
                ? `₹${Number(
                    breakdown.labour
                ).toLocaleString(
                    "en-IN"
                )}`
                : "—"
        );


        setText(
            "electricalPlumbingCost",
            breakdown.electrical_plumbing !==
            undefined
                ? `₹${Number(
                    breakdown.electrical_plumbing
                ).toLocaleString(
                    "en-IN"
                )}`
                : "—"
        );


        setText(
            "finishingCost",
            breakdown.finishing !==
            undefined
                ? `₹${Number(
                    breakdown.finishing
                ).toLocaleString(
                    "en-IN"
                )}`
                : "—"
        );


        setText(
            "contingencyCost",
            breakdown.contingency !==
            undefined
                ? `₹${Number(
                    breakdown.contingency
                ).toLocaleString(
                    "en-IN"
                )}`
                : "—"
        );


        /* =====================================
           MATERIALS
        ===================================== */

        setText(
            "cementQuantity",
            materials.cement_bags !==
            undefined
                ? Number(
                    materials.cement_bags
                ).toLocaleString(
                    "en-IN"
                )
                : "—"
        );


        setText(
            "steelQuantity",
            materials.steel_kg !==
            undefined
                ? Number(
                    materials.steel_kg
                ).toLocaleString(
                    "en-IN"
                )
                : "—"
        );


        setText(
            "sandQuantity",
            materials.sand_cft !==
            undefined
                ? Number(
                    materials.sand_cft
                ).toLocaleString(
                    "en-IN"
                )
                : "—"
        );


        setText(
            "brickQuantity",
            materials.bricks !==
            undefined
                ? Number(
                    materials.bricks
                ).toLocaleString(
                    "en-IN"
                )
                : "—"
        );


        setText(
            "aggregateQuantity",
            materials.aggregate_cft !==
            undefined
                ? Number(
                    materials.aggregate_cft
                ).toLocaleString(
                    "en-IN"
                )
                : "—"
        );


        /* =====================================
           PROJECT DETAILS
        ===================================== */

        setText(
            "detailConstructionType",
            project.construction_type ||
            "—"
        );


        setText(
            "detailLocation",
            project.location ||
            "—"
        );


        setText(
            "detailState",
            project.state ||
            "—"
        );


        setText(
            "detailFloors",
            project.floors ||
            "—"
        );


        setText(
            "detailRooms",
            project.rooms ||
            "—"
        );


        setText(
            "detailDuration",
            project.duration_months
                ? `${project.duration_months} months`
                : "—"
        );


        setText(
            "detailQuality",
            project.quality ||
            "—"
        );


        setText(
            "detailStructure",
            project.structure_type ||
            "—"
        );


        setText(
            "detailMaterialGrade",
            project.material_grade ||
            "—"
        );


        /* =====================================
           DISCLAIMER
        ===================================== */

        setText(
            "estimateDisclaimer",
            estimation.disclaimer ||
            ""
        );


    } catch (error) {

        console.error(
            "ESTIMATION PAGE ERROR:",
            error
        );


        estimateProjectName.textContent =
            "Unable to load estimate.";
    }
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadUserInformation();

        loadDashboardProjects();

        loadEstimationPage();

    }
);