// --- Global Persistent State (Local Storage) ---
let currentUserRole = localStorage.getItem('cerus_role') || 'user';
let currentViewingCategory = 'current';
let currentProjectId = null; 
let taskIdCounter = 0;
let tempNewProfilePicUrl = null;
let currentAnalysisMode = ''; 
let analysisChartInstance = null; 
let currentProjectExceptions = []; 

let registeredUsers = JSON.parse(localStorage.getItem('cerus_users')) || []; 
let savedTeams = JSON.parse(localStorage.getItem('cerus_teams')) || [];
let registeredResources = JSON.parse(localStorage.getItem('cerus_resources')) || [];
let allProjects = JSON.parse(localStorage.getItem('cerus_projects')) || [];
let deletedProjectsCount = parseInt(localStorage.getItem('cerus_deleted_count')) || 0;

function saveAllData() {
    localStorage.setItem('cerus_users', JSON.stringify(registeredUsers));
    localStorage.setItem('cerus_teams', JSON.stringify(savedTeams));
    localStorage.setItem('cerus_resources', JSON.stringify(registeredResources));
    localStorage.setItem('cerus_projects', JSON.stringify(allProjects));
    localStorage.setItem('cerus_deleted_count', deletedProjectsCount);
    localStorage.setItem('cerus_role', currentUserRole);
}

// --- Authentication & User Flow ---
function showSignIn() {
    document.getElementById('auth-selection').classList.add('hidden');
    document.getElementById('sign-in-box').classList.remove('hidden');
}

function showCreateAccount() {
    document.getElementById('auth-selection').classList.add('hidden');
    document.getElementById('create-account-box').classList.remove('hidden');
}

function backToAuthSelection() {
    document.getElementById('sign-in-box').classList.add('hidden');
    document.getElementById('create-account-box').classList.add('hidden');
    document.getElementById('auth-selection').classList.remove('hidden');
}

function handleCreateAccount() {
    const name = document.getElementById('login-name').value.trim();
    const email = document.getElementById('login-email').value.trim();
    const company = document.getElementById('login-company').value.trim();
    const pass = document.getElementById('login-password-create').value;
    const role = document.getElementById('login-role').value;
    const picInput = document.getElementById('login-pic');

    if (!name || !email || !company || !pass) { 
        alert("Please fill in all required fields (Name, Company, Email, and Password)."); 
        return; 
    }

    if (registeredUsers.find(u => u.email === email)) {
        alert("An account with this email already exists. Please Sign In.");
        return;
    }

    let avatarUrl = null;
    if (picInput.files && picInput.files[0]) {
        avatarUrl = URL.createObjectURL(picInput.files[0]);
    }

    registeredUsers.push({ name, email, company, pass, role, avatarUrl });
    saveAllData(); 
    performLoginSetup(name, email, company, role, avatarUrl);
}

function handleSignIn() {
    const email = document.getElementById('signin-email').value.trim();
    const pass = document.getElementById('signin-password').value;
    
    if (!email || !pass) { 
        alert("Please enter both email and password."); 
        return; 
    }
    
    const user = registeredUsers.find(u => u.email === email && u.pass === pass);
    
    if (!user) {
        alert("Account not found or password incorrect. Please try again or create an account.");
        return;
    }

    performLoginSetup(user.name, user.email, user.company, user.role, user.avatarUrl);
}

function performLoginSetup(name, email, company, role, avatarUrl) {
    currentUserRole = role;
    saveAllData();

    document.getElementById('header-name').innerText = name;
    document.getElementById('header-email').innerText = email;
    document.getElementById('ig-name').innerText = name;
    document.getElementById('ig-email').innerText = email;
    document.getElementById('ig-company').innerText = company;

    const hAvatar = document.getElementById('header-avatar');
    const igAvatar = document.getElementById('ig-avatar');
    const igPlaceholder = document.getElementById('ig-avatar-placeholder');

    if (avatarUrl) {
        hAvatar.src = avatarUrl; hAvatar.style.display = 'block';
        igAvatar.src = avatarUrl; igAvatar.style.display = 'block';
        igPlaceholder.style.display = 'none';
    } else {
        hAvatar.style.display = 'none'; igAvatar.style.display = 'none'; igPlaceholder.style.display = 'flex';
        document.getElementById('header-name').innerText += ` (${company})`;
    }

    document.getElementById('nav-create-project').style.display = (currentUserRole === 'user') ? 'none' : 'block';
    document.getElementById('login-overlay').style.display = 'none';
    
    updateHomeMetrics();
}

// --- Dynamic Home Metrics ---
function updateHomeMetrics() {
    let activeWorkers = 0;
    savedTeams.forEach(team => activeWorkers += team.members.length);

    let totalCost = 0;
    allProjects.forEach(proj => {
        proj.tasks.forEach(task => {
            const dur = parseInt(task.dur) || 0;
            if (task.teamMember) {
                const res = registeredResources.find(r => r.name === task.teamMember);
                if (res && res.stdRate) totalCost += parseFloat(res.stdRate) * 8 * dur;
                else totalCost += 50 * 8 * dur;
            }
        });
    });

    document.getElementById('metric-projects').innerText = allProjects.length;
    document.getElementById('metric-cost').innerText = `$${totalCost.toLocaleString()}`;
    document.getElementById('metric-workers').innerText = activeWorkers;
    document.getElementById('metric-teams-count').innerText = savedTeams.length;
    document.getElementById('metric-deleted').innerText = deletedProjectsCount;
}

function setTheme(theme) {
    document.body.classList.remove('dark-theme', 'gray-theme');
    if (theme === 'dark') document.body.classList.add('dark-theme');
    else if (theme === 'gray') document.body.classList.add('gray-theme');
}

function deleteAccount() {
    const code = Math.floor(1000 + Math.random() * 9000);
    if (prompt(`Type ${code} to delete account:`) === code.toString()) {
        alert("Account deleted."); 
        
        const currEmail = document.getElementById('ig-email').innerText;
        registeredUsers = registeredUsers.filter(u => u.email !== currEmail);
        saveAllData();

        document.getElementById('sign-in-box').classList.add('hidden');
        document.getElementById('create-account-box').classList.add('hidden');
        document.getElementById('auth-selection').classList.remove('hidden');
        document.getElementById('login-overlay').style.display = 'flex'; 
        
        document.getElementById('signin-email').value = '';
        document.getElementById('signin-password').value = '';
        
        showSection('home');
    }
}

// --- Navigation ---
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('hidden-sidebar'); }
function toggleDropdown(id) { document.getElementById(id).classList.toggle('hidden'); }

function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(sec => { sec.classList.add('hidden'); sec.classList.remove('active'); });
    const target = document.getElementById(sectionId);
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
}

// --- EDIT PROFILE LOGIC ---
function openEditProfilePage() {
    showSection('edit-profile-page');
    document.getElementById('edit-profile-name').value = document.getElementById('ig-name').innerText;
    document.getElementById('edit-profile-email').value = document.getElementById('ig-email').innerText;
    
    const dobText = document.getElementById('ig-dob').innerText.replace('DOB: ', '');
    document.getElementById('edit-profile-dob').value = (dobText !== 'Not specified') ? dobText : '';
    
    const genderText = document.getElementById('ig-gender').innerText.replace('Gender: ', '');
    document.getElementById('edit-profile-gender').value = genderText;

    tempNewProfilePicUrl = null;
    const currentAvatarSrc = document.getElementById('ig-avatar').src;
    const previewAvatar = document.getElementById('edit-preview-avatar');
    const placeholder = document.getElementById('edit-avatar-placeholder');

    if (document.getElementById('ig-avatar').style.display === 'block') {
        previewAvatar.src = currentAvatarSrc; previewAvatar.style.display = 'block'; placeholder.style.display = 'none';
    } else {
        previewAvatar.style.display = 'none'; placeholder.style.display = 'flex';
    }
}

function openProfilePicModal() {
    document.getElementById('modal-profile-pic-input').value = '';
    document.getElementById('profile-pic-modal-overlay').classList.remove('hidden');
}

function closeProfilePicModal() {
    document.getElementById('profile-pic-modal-overlay').classList.add('hidden');
}

function confirmNewProfilePic() {
    const fileInput = document.getElementById('modal-profile-pic-input');
    if (fileInput.files && fileInput.files[0]) {
        tempNewProfilePicUrl = URL.createObjectURL(fileInput.files[0]);
        const previewAvatar = document.getElementById('edit-preview-avatar');
        const placeholder = document.getElementById('edit-avatar-placeholder');
        previewAvatar.src = tempNewProfilePicUrl; previewAvatar.style.display = 'block'; placeholder.style.display = 'none';
    }
    closeProfilePicModal();
}

function saveEditedProfile() {
    const newName = document.getElementById('edit-profile-name').value.trim();
    const newEmail = document.getElementById('edit-profile-email').value.trim();
    const newDob = document.getElementById('edit-profile-dob').value;
    const newGender = document.getElementById('edit-profile-gender').value;

    if (!newName || !newEmail) { alert("Name and Email cannot be blank."); return; }

    const oldEmail = document.getElementById('ig-email').innerText;
    const userIndex = registeredUsers.findIndex(u => u.email === oldEmail);
    if(userIndex !== -1) {
        registeredUsers[userIndex].name = newName;
        registeredUsers[userIndex].email = newEmail;
        if (tempNewProfilePicUrl) registeredUsers[userIndex].avatarUrl = tempNewProfilePicUrl;
        saveAllData();
    }

    document.getElementById('ig-name').innerText = newName;
    document.getElementById('ig-email').innerText = newEmail;
    document.getElementById('ig-dob').innerText = `DOB: ${newDob || 'Not specified'}`;
    document.getElementById('ig-gender').innerText = `Gender: ${newGender}`;
    document.getElementById('header-name').innerText = newName;
    document.getElementById('header-email').innerText = newEmail;

    if (tempNewProfilePicUrl) {
        document.getElementById('ig-avatar').src = tempNewProfilePicUrl;
        document.getElementById('ig-avatar').style.display = 'block';
        document.getElementById('ig-avatar-placeholder').style.display = 'none';
        document.getElementById('header-avatar').src = tempNewProfilePicUrl;
        document.getElementById('header-avatar').style.display = 'block';
    }

    alert("Profile updated successfully!");
    showSection('account-settings');
}

// --- TEAMS MANAGEMENT ---
function renderTeamsList() {
    const container = document.getElementById('teams-list-container'); container.innerHTML = '';
    if (savedTeams.length === 0) { container.innerHTML = '<p style="color: #64748b;">No teams created yet.</p>'; return; }
    savedTeams.forEach(t => {
        container.innerHTML += `
            <div class="stat-card project-card" style="position: relative;" onclick="openTeamDetails('${t.teamName}')">
                <button class="danger-btn" style="position: absolute; top: 15px; right: 15px; padding: 4px 8px; font-size: 11px;" onclick="event.stopPropagation(); deleteTeamFromList('${t.teamName}')">Delete</button>
                <h3 style="font-size: 20px;">${t.teamName}</h3>
                <p style="margin-top: 5px; color: #7f8c8d; font-size: 13px;"><b>Roles:</b> ${t.members.map(m => m.role).join(', ')}</p>
                <p style="margin-top: 10px;"><b>${t.members.length}</b> Members Allocated</p>
                <p style="margin-top: 5px; font-size: 12px; color: #3b82f6;">Click to view/edit →</p>
            </div>
        `;
    });
    updateHomeMetrics();
}
function showCreateTeamFlow() {
    document.getElementById('teams-list-header').classList.add('hidden');
    document.getElementById('teams-list-container').classList.add('hidden');
    document.getElementById('create-team-name-step').classList.remove('hidden');
    document.getElementById('newTeamName').value = '';
}
function cancelTeamCreation() {
    document.getElementById('create-team-name-step').classList.add('hidden');
    document.getElementById('team-members-setup').classList.add('hidden');
    document.getElementById('teams-list-header').classList.remove('hidden');
    document.getElementById('teams-list-container').classList.remove('hidden');
    renderTeamsList();
}
function initTeamTable() {
    const tName = document.getElementById('newTeamName').value.trim();
    if (!tName) { alert("Enter a team name!"); return; }
    document.getElementById('display-new-team-name').innerText = tName;
    document.getElementById('create-team-name-step').classList.add('hidden');
    document.getElementById('team-members-setup').classList.remove('hidden');
    document.getElementById('team-setup-tbody').innerHTML = '';
    addTeamMemberRow();
}
function openTeamDetails(tName) {
    document.getElementById('teams-list-header').classList.add('hidden');
    document.getElementById('teams-list-container').classList.add('hidden');
    document.getElementById('team-members-setup').classList.remove('hidden');
    document.getElementById('display-new-team-name').innerText = tName;
    
    document.getElementById('team-setup-tbody').innerHTML = '';
    const teamData = savedTeams.find(t => t.teamName === tName);
    if (teamData) {
        teamData.members.forEach(m => addTeamMemberRow(m));
    }
}

function addTeamMemberRow(member = null) {
    const rowId = 'member-' + Math.random().toString(36).substr(2, 9);
    const tr = document.createElement('tr');
    tr.className = 'team-member-row';

    const mName = member ? member.name : '';
    const mRole = member ? member.role : '';
    const mTimeFrom = member && member.timeFrom ? member.timeFrom : '09:00';
    const mTimeTo = member && member.timeTo ? member.timeTo : '17:00';

    tr.innerHTML = `
        <td style="vertical-align: top; padding-top: 16px;">
            <input type="text" class="t-name" placeholder="Member Name" value="${mName}" style="width: 100%;">
        </td>
        <td style="vertical-align: top; padding-top: 16px;">
            <input type="text" class="t-role" placeholder="Assigned Role" value="${mRole}" style="width: 100%;">
        </td>
        <td style="vertical-align: top; padding-top: 16px;">
            <div style="display: flex; gap: 5px; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 12px; color: #64748b; width: 35px;">From:</span>
                <input type="time" class="t-time-from" value="${mTimeFrom}" style="width: 110px;">
            </div>
            <div style="display: flex; gap: 5px; align-items: center;">
                <span style="font-size: 12px; color: #64748b; width: 35px;">To:</span>
                <input type="time" class="t-time-to" value="${mTimeTo}" style="width: 110px;">
            </div>
        </td>
        <td style="vertical-align: top; padding-top: 16px;">
            <div class="exceptions-container" id="exc-${rowId}" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;"></div>
            <button class="outline-btn" style="font-size: 11px; padding: 4px 8px;" onclick="addExceptionRow('exc-${rowId}')">+ Add Exception</button>
        </td>
        <td style="vertical-align: top; text-align: center; padding-top: 16px;">
            <button class="danger-btn delete-btn" onclick="this.closest('tr').remove()">X</button>
        </td>
    `;
    document.getElementById('team-setup-tbody').appendChild(tr);

    if (member && member.exceptions) {
        member.exceptions.forEach(exc => addExceptionRow(`exc-${rowId}`, exc));
    }
}

function addExceptionRow(containerId, exc = null) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'exception-item';
    div.style.cssText = "display: flex; gap: 5px; align-items: center; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;";

    const eName = exc ? exc.name : '';
    const eStart = exc ? exc.start : '';
    const eEnd = exc ? exc.end : '';
    const eFrom = exc ? exc.timeFrom : '';
    const eTo = exc ? exc.timeTo : '';

    div.innerHTML = `
        <input type="text" class="e-name" placeholder="Reason (e.g. Leave)" value="${eName}" style="width: 130px; padding: 6px; font-size: 12px;">
        <input type="date" class="e-start" value="${eStart}" style="width: 115px; padding: 6px; font-size: 12px;" title="Start Date">
        <span style="color: #94a3b8; font-size: 12px;">to</span>
        <input type="date" class="e-end" value="${eEnd}" style="width: 115px; padding: 6px; font-size: 12px;" title="End Date">
        <input type="time" class="e-from" value="${eFrom}" style="width: 90px; padding: 6px; font-size: 12px;" title="Time From">
        <span style="color: #94a3b8; font-size: 12px;">to</span>
        <input type="time" class="e-to" value="${eTo}" style="width: 90px; padding: 6px; font-size: 12px;" title="Time To">
        <button class="danger-btn delete-btn" style="padding: 6px; font-size: 10px;" onclick="this.closest('.exception-item').remove()">X</button>
    `;
    container.appendChild(div);
}

function saveTeam() {
    const teamName = document.getElementById('display-new-team-name').innerText;
    let members = [];
    
    document.querySelectorAll('#team-setup-tbody tr.team-member-row').forEach(row => {
        const n = row.querySelector('.t-name').value.trim();
        const r = row.querySelector('.t-role').value.trim();
        const tFrom = row.querySelector('.t-time-from').value;
        const tTo = row.querySelector('.t-time-to').value;

        let exceptions = [];
        row.querySelectorAll('.exception-item').forEach(excDiv => {
            const eN = excDiv.querySelector('.e-name').value.trim();
            const eS = excDiv.querySelector('.e-start').value;
            const eE = excDiv.querySelector('.e-end').value;
            const eF = excDiv.querySelector('.e-from').value;
            const eT = excDiv.querySelector('.e-to').value;
            
            if (eN || eS || eE) {
                exceptions.push({ name: eN, start: eS, end: eE, timeFrom: eF, timeTo: eT });
            }
        });

        if (n && r) members.push({ name: n, role: r, timeFrom: tFrom, timeTo: tTo, exceptions: exceptions });
    });
    
    if (members.length === 0) { alert("Add at least one member!"); return; }
    
    savedTeams = savedTeams.filter(t => t.teamName !== teamName);
    savedTeams.push({ teamName, members });
    saveAllData(); 
    alert(`Team '${teamName}' saved successfully!`);
    cancelTeamCreation();
}

function deleteCurrentTeam() {
    if (confirm("Delete this entire team?")) {
        const tName = document.getElementById('display-new-team-name').innerText;
        savedTeams = savedTeams.filter(t => t.teamName !== tName);
        saveAllData();
        cancelTeamCreation();
    }
}
function deleteTeamFromList(tName) {
    if (confirm(`Delete team '${tName}'?`)) {
        savedTeams = savedTeams.filter(t => t.teamName !== tName);
        saveAllData();
        renderTeamsList();
    }
}

// --- RESOURCE GROUPS MANAGEMENT ---
let isDraggingDays = false, setDayToActive = false;
const dayTogglesClass = 'day-toggle';

function handleDragStart(e) {
    const target = e.target;
    if (target.classList.contains(dayTogglesClass)) {
        isDraggingDays = true;
        setDayToActive = !target.classList.contains('active');
        setDayToActive ? target.classList.add('active') : target.classList.remove('active');
    }
}
function handleDragMove(e) {
    if (!isDraggingDays) return;
    let target = e.target;
    if (e.type === 'touchmove') {
        const touch = e.touches[0];
        target = document.elementFromPoint(touch.clientX, touch.clientY);
    }
    if (target && target.classList.contains(dayTogglesClass)) {
        setDayToActive ? target.classList.add('active') : target.classList.remove('active');
    }
}
function handleDragEnd() { isDraggingDays = false; }

document.addEventListener('mousedown', handleDragStart);
document.addEventListener('mouseover', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);
document.addEventListener('touchstart', handleDragStart, {passive: true});
document.addEventListener('touchmove', handleDragMove, {passive: true});
document.addEventListener('touchend', handleDragEnd);

function renderResourceGroupsList() {
    const container = document.getElementById('resource-groups-list'); container.innerHTML = '';
    const uniqueGroups = [...new Set(registeredResources.map(r => r.group))];
    if (uniqueGroups.length === 0) { container.innerHTML = '<p style="color: #64748b;">No resource groups yet.</p>'; return; }
    uniqueGroups.forEach(gName => {
        const count = registeredResources.filter(r => r.group === gName).length;
        container.innerHTML += `
            <div class="stat-card project-card" style="position: relative;" onclick="openResourceGroupDetails('${gName}')">
                <button class="danger-btn" style="position: absolute; top: 15px; right: 15px; padding: 4px 8px; font-size: 11px;" onclick="event.stopPropagation(); deleteResourceGroupFromList('${gName}')">Delete</button>
                <h3 style="font-size: 20px;">${gName}</h3>
                <p style="margin-top: 10px;">${count} Team Members</p>
                <p style="margin-top: 10px; font-size: 12px; color: #3b82f6;">Click to view/edit →</p>
            </div>
        `;
    });
}
function showNewResourceForm() {
    document.getElementById('resource-list-header').classList.add('hidden');
    document.getElementById('resource-groups-list').classList.add('hidden');
    document.getElementById('resource-group-name-step').classList.remove('hidden');
    document.getElementById('resourceGroupName').value = ''; 
}
function startAddingResources() {
    const gName = document.getElementById('resourceGroupName').value.trim();
    if (!gName) { alert("Enter Group name!"); return; }
    document.getElementById('current-group-display').innerText = gName;
    document.getElementById('resource-group-name-step').classList.add('hidden');
    document.getElementById('new-resource-form').classList.remove('hidden');
    document.getElementById('resource-tbody').innerHTML = '';
    addResourceRow();
}
function openResourceGroupDetails(gName) {
    document.getElementById('resource-list-header').classList.add('hidden');
    document.getElementById('resource-groups-list').classList.add('hidden');
    document.getElementById('new-resource-form').classList.remove('hidden');
    document.getElementById('current-group-display').innerText = gName;
    
    const tbody = document.getElementById('resource-tbody'); tbody.innerHTML = '';
    registeredResources.filter(r => r.group === gName).forEach(res => {
        const tr = document.createElement('tr');
        const teamOpts = savedTeams.map(t => `<option value="${t.teamName}" ${t.teamName === res.team ? 'selected' : ''}>${t.teamName}</option>`).join('');
        
        let nameOpts = '<option value="">Name...</option>';
        const teamData = savedTeams.find(t => t.teamName === res.team);
        if (teamData) {
            teamData.members.forEach(m => {
                nameOpts += `<option value="${m.name}" data-role="${m.role}" ${m.name === res.name ? 'selected' : ''}>${m.name}</option>`;
            });
        }

        tr.innerHTML = `
            <td><select class="r-team" onchange="onResourceGroupTeamChange(this)"><option value="">Team...</option>${teamOpts}</select></td>
            <td><select class="r-name" onchange="onResourceGroupNameChange(this)">${nameOpts}</select></td>
            <td><input type="text" class="r-role" value="${res.role}" style="background:#f8fafc;" readonly></td>
            <td><input type="number" class="r-hours" value="8" style="width:60px;"></td>
            <td><div class="day-toggles"><div class="day-toggle active">M</div><div class="day-toggle active">T</div><div class="day-toggle active">W</div><div class="day-toggle active">T</div><div class="day-toggle active">F</div><div class="day-toggle">S</div><div class="day-toggle">S</div></div></td>
            <td><input type="number" class="r-max-units" value="${res.maxUnits||100}" style="width:70px;"></td>
            <td><input type="number" class="r-std-rate" value="${res.stdRate||50}" style="width:70px;"></td>
            <td><input type="number" class="r-ovt-rate" value="${res.ovtRate||75}" style="width:70px;"></td>
            <td><input type="number" class="r-cost" value="50" style="width:70px;"></td>
            <td><select class="r-cost-type" style="width:85px;"><option>Hour</option><option>Day</option></select></td>
        `;
        tbody.appendChild(tr);
    });
}
function goBackToResourceGroups() {
    document.getElementById('new-resource-form').classList.add('hidden');
    document.getElementById('resource-group-name-step').classList.add('hidden');
    document.getElementById('resource-list-header').classList.remove('hidden');
    document.getElementById('resource-groups-list').classList.remove('hidden');
    renderResourceGroupsList();
}
function getSavedTeamOptions() { return savedTeams.map(t => `<option value="${t.teamName}">${t.teamName}</option>`).join(''); }
function onResourceGroupTeamChange(select) {
    const row = select.closest('tr'); const nameSel = row.querySelector('.r-name'); const roleInp = row.querySelector('.r-role');
    nameSel.innerHTML = '<option value="">Name...</option>'; roleInp.value = '';
    const teamData = savedTeams.find(t => t.teamName === select.value);
    if (teamData) teamData.members.forEach(m => { nameSel.innerHTML += `<option value="${m.name}" data-role="${m.role}">${m.name}</option>`; });
}
function onResourceGroupNameChange(select) { select.closest('tr').querySelector('.r-role').value = select.options[select.selectedIndex].getAttribute('data-role') || ''; }
function addResourceRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><select class="r-team" onchange="onResourceGroupTeamChange(this)"><option value="">Team...</option>${getSavedTeamOptions()}</select></td>
                    <td><select class="r-name" onchange="onResourceGroupNameChange(this)"><option value="">Name...</option></select></td>
                    <td><input type="text" class="r-role" placeholder="Role" style="background:#f8fafc;" readonly></td>
                    <td><input type="number" class="r-hours" value="8" style="width:60px;"></td>
                    <td><div class="day-toggles"><div class="day-toggle active">M</div><div class="day-toggle active">T</div><div class="day-toggle active">W</div><div class="day-toggle active">T</div><div class="day-toggle active">F</div><div class="day-toggle">S</div><div class="day-toggle">S</div></div></td>
                    <td><input type="number" class="r-max-units" value="100" style="width:70px;"></td>
                    <td><input type="number" class="r-std-rate" value="50" style="width:70px;"></td>
                    <td><input type="number" class="r-ovt-rate" value="75" style="width:70px;"></td>
                    <td><input type="number" class="r-cost" value="50" style="width:70px;"></td>
                    <td><select class="r-cost-type" style="width:85px;"><option>Hour</option><option>Day</option></select></td>`;
    document.getElementById('resource-tbody').appendChild(tr);
}
function saveResourceGroup() {
    const gName = document.getElementById('current-group-display').innerText;
    registeredResources = registeredResources.filter(r => r.group !== gName);
    
    document.querySelectorAll('#resource-tbody tr').forEach(row => {
        const team = row.querySelector('.r-team').value; const name = row.querySelector('.r-name').value; const role = row.querySelector('.r-role').value;
        if (name && role) registeredResources.push({ group: gName, team, name, role, maxUnits: row.querySelector('.r-max-units').value, stdRate: row.querySelector('.r-std-rate').value, ovtRate: row.querySelector('.r-ovt-rate').value });
    });
    saveAllData(); 
    alert(`Resource Group '${gName}' saved!`);
    goBackToResourceGroups();
}
function deleteCurrentResourceGroup() {
    if (confirm("Delete this entire resource group?")) {
        const gName = document.getElementById('current-group-display').innerText;
        registeredResources = registeredResources.filter(r => r.group !== gName);
        saveAllData();
        goBackToResourceGroups();
    }
}
function deleteResourceGroupFromList(gName) {
    if (confirm(`Delete resource group '${gName}'?`)) {
        registeredResources = registeredResources.filter(r => r.group !== gName);
        saveAllData();
        renderResourceGroupsList();
    }
}

// --- Project Modals & Task Grid ---
function showProjectModal() {
    document.getElementById('projectName').value = '';
    document.getElementById('project-modal-step-1').classList.remove('hidden');
    document.getElementById('project-modal-step-2').classList.add('hidden');
    document.getElementById('project-modal-overlay').classList.remove('hidden');
}
function closeProjectModal() { document.getElementById('project-modal-overlay').classList.add('hidden'); }
function createEnvironment() {
    const pName = document.getElementById('projectName').value.trim();
    if (!pName) { alert("Enter project name!"); return; }
    currentProjectId = null; 
    document.getElementById('current-project-display').innerText = pName;
    document.getElementById('project-modal-step-1').classList.add('hidden');
    document.getElementById('project-modal-step-2').classList.remove('hidden');
}

// --- PROJECT CALENDAR & EXCEPTIONS LOGIC ---
function toggleProjectExceptionTimes() {
    const type = document.getElementById('proj-exc-type').value;
    const timeContainer = document.getElementById('proj-exc-time-container');
    if (type === 'working') {
        timeContainer.style.display = 'flex';
        document.getElementById('proj-exc-from').value = document.getElementById('project-time-from').value;
        document.getElementById('proj-exc-to').value = document.getElementById('project-time-to').value;
    } else {
        timeContainer.style.display = 'none';
    }
}

function updateProjectExceptionDefaults() {
    if (document.getElementById('proj-exc-time-container').style.display === 'flex') {
        document.getElementById('proj-exc-from').value = document.getElementById('project-time-from').value;
        document.getElementById('proj-exc-to').value = document.getElementById('project-time-to').value;
    }
}

function addProjectException() {
    const name = document.getElementById('proj-exc-name').value.trim();
    const type = document.getElementById('proj-exc-type').value;
    const start = document.getElementById('proj-exc-start').value;
    const end = document.getElementById('proj-exc-end').value;
    
    if (!name || !start || !end) { alert("Please provide notice/reason, start date, and finish date."); return; }
    
    const timeFrom = type === 'working' ? document.getElementById('proj-exc-from').value : '00:00';
    const timeTo = type === 'working' ? document.getElementById('proj-exc-to').value : '00:00';

    currentProjectExceptions.push({ name, type, start, end, timeFrom, timeTo });
    renderProjectExceptions();
    
    document.getElementById('proj-exc-name').value = '';
    document.getElementById('proj-exc-start').value = '';
    document.getElementById('proj-exc-end').value = '';
}

function renderProjectExceptions() {
    const list = document.getElementById('project-exceptions-list');
    list.innerHTML = '';
    currentProjectExceptions.forEach((exc, index) => {
        const times = exc.type === 'working' ? ` (${exc.timeFrom} - ${exc.timeTo})` : ' (Non-Working)';
        const color = exc.type === 'working' ? '#10b981' : '#ef4444';
        list.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; font-size: 12px;">
                <span><b style="color: ${color};">${exc.name}</b>: ${exc.start} to ${exc.end}${times}</span>
                <button class="danger-btn delete-btn" style="padding: 2px 6px;" onclick="removeProjectException(${index})">X</button>
            </div>
        `;
    });
}

function removeProjectException(index) {
    currentProjectExceptions.splice(index, 1);
    renderProjectExceptions();
}

function recalculateProjectFinishDate() {
    let maxEnd = null;
    document.querySelectorAll('#tasks-tbody tr').forEach(row => {
        const endInput = row.querySelector('.end-date');
        if (endInput && endInput.value) {
            const eDate = new Date(endInput.value);
            if (!maxEnd || eDate > maxEnd) maxEnd = eDate;
        }
    });
    
    if (maxEnd) {
        document.getElementById('project-finish-date').value = maxEnd.toISOString().split('T')[0];
    } else {
        document.getElementById('project-finish-date').value = '';
    }
}

// Sync all task start dates when the project start date changes
function syncTaskStartDates(newDate) {
    if (!newDate) return;
    document.querySelectorAll('#tasks-tbody tr').forEach(row => {
        const startInput = row.querySelector('.start-date');
        if (startInput) {
            startInput.value = newDate;
            calculateDates(startInput); 
        }
    });
}

function routeFromModal(dest) {
    closeProjectModal();
    if (dest === 'tasks') {
        showSection('tasks-view');
        document.getElementById('sidebar').classList.add('hidden-sidebar');
        document.getElementById('back-to-list-btn').style.display = 'block';
        document.getElementById('task-action-buttons').style.display = 'flex';
        document.getElementById('add-main-task-btn').style.display = 'block';
        document.getElementById('task-view-title').innerText = "Projects";
        
        document.getElementById('project-start-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('project-time-from').value = '09:00';
        document.getElementById('project-time-to').value = '17:00';
        currentProjectExceptions = [];
        renderProjectExceptions();

        document.getElementById('tasks-tbody').innerHTML = '';
        addTaskRow('parent'); 
        updateProjectBudgetSummary();
        recalculateProjectFinishDate();
    }
}

function viewProjectCategory(category) {
    currentViewingCategory = category; showSection('project-list-section');
    const titles = { 'upcoming': 'Upcoming', 'current': 'Currently Running', 'completed': 'Completed' };
    document.getElementById('list-section-title').innerText = `${titles[category]} Projects`;
    const container = document.getElementById('project-cards-container'); container.innerHTML = '';
    const today = new Date(); today.setHours(0,0,0,0);
    
    const filtered = allProjects.filter(p => {
        if (!p.startDate) return false;
        const pStart = new Date(p.startDate);
        const pEnd = new Date(p.endDate);
        if (category === 'upcoming') return pStart > today;
        if (category === 'completed') return pEnd < today;
        if (category === 'current') return pStart <= today && pEnd >= today;
    });
    
    if (filtered.length === 0) { container.innerHTML = `<p style="color: #64748b;">No ${category} projects found.</p>`; return; }
    
    filtered.forEach(p => {
        const badgeClass = category === 'current' ? 'status-current' : (category === 'upcoming' ? 'status-upcoming' : 'status-completed');
        const sDate = p.startDate ? p.startDate : 'N/A';
        const eDate = p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : 'N/A';
        container.innerHTML += `
            <div class="stat-card project-card" onclick="openProjectDetails('${p.id}', '${category}')">
                <h3 style="font-size: 20px;">${p.name}</h3>
                <p style="margin-top: 10px; color: #475569;"><b>Starts:</b> ${sDate}</p>
                <p style="color: #475569;"><b>Deadline:</b> ${eDate}</p>
                <span class="status-badge ${badgeClass}">${category}</span>
            </div>
        `;
    });
}

function openProjectDetails(pId, category) {
    const proj = allProjects.find(p => p.id === pId); if (!proj) return;
    currentProjectId = pId; showSection('tasks-view');
    document.getElementById('current-project-display').innerText = proj.name;
    document.getElementById('sidebar').classList.add('hidden-sidebar');
    document.getElementById('back-to-list-btn').style.display = 'block';
    
    document.getElementById('project-start-date').value = proj.startDate || '';
    document.getElementById('project-time-from').value = proj.timeFrom || '09:00';
    document.getElementById('project-time-to').value = proj.timeTo || '17:00';
    currentProjectExceptions = proj.exceptions ? [...proj.exceptions] : [];
    renderProjectExceptions();

    const tbody = document.getElementById('tasks-tbody'); tbody.innerHTML = '';
    
    proj.tasks.forEach(t => { 
        addTaskRow(t.isSub ? 'sub' : 'parent'); 
        const lastRow = tbody.lastElementChild;
        if (lastRow) {
            lastRow.querySelector('.task-name-field').value = t.name || '';
            lastRow.querySelector('.start-date').value = t.start || '';
            lastRow.querySelector('.end-date').value = t.end || '';
            lastRow.querySelector('.duration-input').value = t.dur || 3;
            lastRow.querySelector('.milestone-checkbox').checked = t.milestone || false;
            if (t.teamMember) lastRow.querySelector('.team-select').value = t.teamMember;
        }
    });

    const isComp = (category === 'completed');
    document.getElementById('task-action-buttons').style.display = isComp ? 'none' : 'flex';
    document.getElementById('add-main-task-btn').style.display = isComp ? 'none' : 'block';
    
    if(isComp) {
        document.querySelectorAll('#tasks-view input, #tasks-view select, #tasks-view button').forEach(el => {
            if(el.id !== 'back-to-list-btn') el.disabled = true;
        });
        tbody.querySelectorAll('.delete-btn, .outline-btn').forEach(el => el.style.display = 'none');
    } else {
        document.querySelectorAll('#tasks-view input, #tasks-view select, #tasks-view button').forEach(el => el.disabled = false);
    }
    
    document.getElementById('task-view-title').innerText = isComp ? "Projects (Read-Only)" : "Projects";
    updateGanttChart();
    updateProjectBudgetSummary();
    recalculateProjectFinishDate();
}

function goBackToProjects() {
    document.getElementById('sidebar').classList.remove('hidden-sidebar');
    document.getElementById('back-to-list-btn').style.display = 'none';
    viewProjectCategory(currentViewingCategory);
}

function getGroupOptions() { return [...new Set(registeredResources.map(r => r.group))].map(g => `<option value="${g}">${g}</option>`).join(''); }
function updateRoleDropdown(gSel) {
    const rSel = gSel.closest('tr').querySelector('.role-select'); const tSel = gSel.closest('tr').querySelector('.team-select');
    rSel.innerHTML = '<option value="">Role...</option>'; tSel.innerHTML = '<option value="">Name...</option>';
    [...new Set(registeredResources.filter(r => r.group === gSel.value).map(r => r.role))].forEach(role => { rSel.innerHTML += `<option value="${role}">${role}</option>`; });
}
function updateTeamDropdown(rSel) {
    const gVal = rSel.closest('tr').querySelector('.group-select').value; const tSel = rSel.closest('tr').querySelector('.team-select');
    tSel.innerHTML = '<option value="">Name...</option>';
    registeredResources.filter(r => r.group === gVal && r.role === rSel.value).forEach(s => { tSel.innerHTML += `<option value="${s.name}">${s.name}</option>`; });
}

function calculateDates(inputElement) {
    const row = inputElement.closest('tr');
    const startInput = row.querySelector('.start-date');
    const endInput = row.querySelector('.end-date');
    const durationInput = row.querySelector('.duration-input');

    const startDateVal = startInput.value;
    const endDateVal = endInput.value;
    const durationVal = durationInput.value;

    if (startDateVal && endDateVal && inputElement !== durationInput) {
        const start = new Date(startDateVal);
        const end = new Date(endDateVal);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationInput.value = diffDays > 0 ? diffDays : 1;
    } else if (startDateVal && durationVal && (inputElement === durationInput || inputElement === startInput)) {
        const start = new Date(startDateVal);
        const days = parseInt(durationVal) || 1;
        start.setDate(start.getDate() + days);
        endInput.value = start.toISOString().split('T')[0];
    } else if (!startDateVal && durationVal && inputElement === durationInput) {
        const today = new Date();
        startInput.value = today.toISOString().split('T')[0];
        today.setDate(today.getDate() + parseInt(durationVal));
        endInput.value = today.toISOString().split('T')[0];
    }

    updateGanttChart();
    updateProjectBudgetSummary();
    recalculateProjectFinishDate();
}

function addTaskRow(type = 'parent', btn = null) {
    taskIdCounter++;
    const tr = document.createElement('tr'); const isSub = type === 'sub'; if (isSub) tr.classList.add('subtask-row');
    
    const projStart = document.getElementById('project-start-date').value;
    const defaultStart = projStart ? projStart : new Date().toISOString().split('T')[0];
    
    const defaultEndObj = new Date(defaultStart);
    defaultEndObj.setDate(defaultEndObj.getDate() + 3);
    const defaultEnd = defaultEndObj.toISOString().split('T')[0];

    tr.innerHTML = `<td class="${isSub ? 'subtask-indent' : ''}"><input type="text" class="task-name-field" style="width:130px;" placeholder="${isSub ? 'Sub' : 'Main'}" oninput="updateGanttChart()"></td>
        <td style="text-align: center;"><input type="checkbox" class="milestone-checkbox" title="Mark as Milestone" onchange="updateGanttChart()"></td>
        <td><select class="group-select" style="width:110px;" onchange="updateRoleDropdown(this)"><option value="">Group</option>${getGroupOptions()}</select></td>
        <td><select class="role-select" style="width:100px;" onchange="updateTeamDropdown(this)"><option value="">Role</option></select></td>
        <td><select class="team-select" style="width:110px;" onchange="updateProjectBudgetSummary()"><option value="">Name</option></select></td>
        <td><input type="date" class="start-date" style="width:125px;" value="${defaultStart}" onchange="calculateDates(this)"></td>
        <td><input type="date" class="end-date" style="width:125px;" value="${defaultEnd}" onchange="calculateDates(this)"></td>
        <td><input type="number" class="duration-input" style="width:60px;" value="3" oninput="calculateDates(this)"></td>
        <td style="white-space:nowrap;">${!isSub ? `<button onclick="addTaskRow('sub', this)" class="outline-btn" style="font-size:11px; padding:4px 8px;">+ Sub</button>` : ''}<button onclick="deleteTask(this)" class="delete-btn" style="margin-left: 4px;">Del</button></td>`;
    if (isSub && btn) btn.closest('tr').insertAdjacentElement('afterend', tr);
    else document.getElementById('tasks-tbody').appendChild(tr);
    updateGanttChart();
    updateProjectBudgetSummary();
    recalculateProjectFinishDate();
}

function deleteTask(btn) {
    if (confirm("Delete task?")) {
        const r = btn.closest('tr');
        if (!r.classList.contains('subtask-row')) {
            let n = r.nextElementSibling, subs = [];
            while (n && n.classList.contains('subtask-row')) { subs.push(n); n = n.nextElementSibling; }
            if (subs.length > 0 && confirm(`Also delete ${subs.length} subtask(s)?`)) subs.forEach(s => s.remove());
        }
        r.remove(); updateGanttChart(); updateProjectBudgetSummary(); recalculateProjectFinishDate();
    }
}

function updateProjectBudgetSummary() {
    let totalCost = 0; let maxDays = 0;
    document.querySelectorAll('#tasks-tbody tr').forEach(row => {
        const dur = parseInt(row.querySelector('.duration-input').value) || 0;
        if (dur > maxDays) maxDays = dur;
        const memberName = row.querySelector('.team-select').value;
        if (memberName) {
            const res = registeredResources.find(r => r.name === memberName);
            if (res && res.stdRate) totalCost += parseFloat(res.stdRate) * 8 * dur;
            else totalCost += 50 * 8 * dur;
        }
    });
    document.getElementById('project-total-cost').innerText = `$${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('project-total-days').innerText = `${maxDays} Days`;
}

function saveProjectTasks() {
    const pName = document.getElementById('current-project-display').innerText;
    const pStart = document.getElementById('project-start-date').value;
    const pTimeFrom = document.getElementById('project-time-from').value;
    const pTimeTo = document.getElementById('project-time-to').value;

    let maxEnd = null, savedTasks = [];
    
    document.querySelectorAll('#tasks-tbody tr').forEach(row => {
        const start = row.querySelector('.start-date').value; const end = row.querySelector('.end-date').value;
        if (start && end) {
            const eDate = new Date(end);
            if (!maxEnd || eDate > maxEnd) maxEnd = eDate;
        }
        savedTasks.push({
            name: row.querySelector('.task-name-field').value, start: start, end: end, dur: row.querySelector('.duration-input').value,
            milestone: row.querySelector('.milestone-checkbox').checked, teamMember: row.querySelector('.team-select').value, isSub: row.classList.contains('subtask-row')
        });
    });
    
    if (!pStart || !maxEnd) { alert("Please ensure project start date and task dates are valid."); return; }
    
    if (currentProjectId) allProjects = allProjects.filter(p => p.id !== currentProjectId);
    allProjects.push({ 
        id: currentProjectId || Date.now().toString(), 
        name: pName, 
        startDate: pStart, 
        endDate: maxEnd, 
        timeFrom: pTimeFrom,
        timeTo: pTimeTo,
        exceptions: [...currentProjectExceptions],
        tasks: savedTasks 
    });
    
    saveAllData(); 
    alert("Project saved successfully!");
    document.getElementById('tasks-tbody').innerHTML = ''; showSection('home');
}

function cancelProjectAction() {
    if (confirm("Cancel and lose unsaved changes?")) {
        document.getElementById('tasks-tbody').innerHTML = '';
        document.getElementById('back-to-list-btn').style.display = 'none';
        document.getElementById('sidebar').classList.remove('hidden-sidebar');
        showSection('home');
    }
}
function deleteWholeProject() {
    if (!confirm("Are you sure you want to completely delete this project? This cannot be undone.")) return;
    if (prompt("Security Check: Type 'delete' below:")?.trim().toLowerCase() === 'delete') {
        if (currentProjectId) allProjects = allProjects.filter(p => p.id !== currentProjectId);
        alert("Project deleted.");
        document.getElementById('tasks-tbody').innerHTML = '';
        document.getElementById('back-to-list-btn').style.display = 'none';
        document.getElementById('sidebar').classList.remove('hidden-sidebar');
        updateGanttChart(); currentProjectId = null; deletedProjectsCount++; 
        saveAllData();
        showSection('home');
    } else alert("Incorrect word. Deletion cancelled.");
}

function updateGanttChart() {
    const cont = document.getElementById('gantt-visual-container'); if (!cont) return;
    const rows = document.querySelectorAll('#tasks-tbody tr');
    if (rows.length === 0) { cont.innerHTML = '<p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 20px;">No tasks added yet.</p>'; return; }
    cont.innerHTML = '';
    rows.forEach((r, i) => {
        const name = r.querySelector('.task-name-field').value || `Task ${i+1}`;
        const dur = parseInt(r.querySelector('.duration-input').value) || 1;
        const isMilestone = r.querySelector('.milestone-checkbox').checked;
        const isSub = r.classList.contains('subtask-row');
        
        const displayLabel = isMilestone ? `🚩 ${name} (Milestone)` : name;
        const barColor = isMilestone ? '#f59e0b' : (isSub ? '#94a3b8' : '#3b82f6');
        const barWidth = isMilestone ? 25 : Math.max(dur * 15, 30);

        cont.innerHTML += `<div class="gantt-row-bar"><div class="gantt-label" style="${isSub?'padding-left:15px;color:#64748b;font-weight:normal;':''}">${displayLabel}</div><div class="gantt-track"><div class="gantt-bar" style="width:${barWidth}px; background:${barColor};">${isMilestone ? 'M' : dur+'d'}</div></div></div>`;
    });
}

// --- ANALYSIS SECTION LOGIC ---
function loadAnalysisProjectList(mode) {
    currentAnalysisMode = mode;
    showSection('analysis-section');
    
    const modeTitles = { 'network': 'Project Trends (Cost & Duration)', 'graphs': 'Budget Distribution ($)', 'bargraph': 'Comprehensive Task Metrics' };
    document.getElementById('analysis-heading').innerText = `Select Project for ${modeTitles[mode]}`;
    
    document.getElementById('analysis-display-area').classList.add('hidden');
    document.getElementById('analysis-list-header').classList.remove('hidden');
    
    const container = document.getElementById('analysis-project-list');
    container.innerHTML = '';
    container.classList.remove('hidden');

    if (allProjects.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No projects available for analysis.</p>';
        return;
    }

    allProjects.forEach(p => {
        container.innerHTML += `
            <div class="stat-card project-card" onclick="openProjectAnalysis('${p.id}', '${p.name}')">
                <h3 style="font-size: 20px;">${p.name}</h3>
                <p style="margin-top: 10px; color: #475569;">${p.tasks.length} Tasks</p>
                <p style="margin-top: 10px; font-size: 12px; color: #3b82f6;">Generate ${modeTitles[mode]} →</p>
            </div>
        `;
    });
}

function openProjectAnalysis(projectId, projectName) {
    document.getElementById('analysis-list-header').classList.add('hidden');
    document.getElementById('analysis-project-list').classList.add('hidden');
    document.getElementById('analysis-display-area').classList.remove('hidden');
    
    const modeTitles = { 'network': 'Project Trends (Cost & Duration)', 'graphs': 'Budget Distribution ($)', 'bargraph': 'Comprehensive Task Metrics' };
    document.getElementById('analysis-type-subtitle').innerText = modeTitles[currentAnalysisMode];
    document.getElementById('analysis-project-name').innerText = projectName;
    
    const canvasContainer = document.getElementById('analysis-render-canvas');
    const project = allProjects.find(p => p.id === projectId);
    
    if (!project || !project.tasks || project.tasks.length === 0) {
        canvasContainer.innerHTML = `<div style="text-align: center; color: #64748b;"><h3 style="margin-bottom: 5px;">No Data</h3><p>Please add tasks to this project to generate an analysis.</p></div>`;
        return;
    }

    canvasContainer.innerHTML = '<canvas id="myChart" style="width: 100%; max-height: 400px;"></canvas>';
    const ctx = document.getElementById('myChart').getContext('2d');

    if (analysisChartInstance) {
        analysisChartInstance.destroy();
    }

    const labels = [];
    const durations = [];
    const laborHours = [];
    const stdRates = [];
    const ovtRates = [];
    const baseCosts = [];
    const cumulativeCosts = [];
    const costPerDay = [];
    const maxUnitsArr = [];
    
    let currentTotal = 0;

    project.tasks.forEach((t, i) => {
        labels.push(t.name || `Task ${i+1}`);
        const dur = parseInt(t.dur) || 1;
        durations.push(dur);
        laborHours.push(dur * 8);

        let stdR = 50; let ovtR = 75; let units = 100;

        if (t.teamMember) {
            const res = registeredResources.find(r => r.name === t.teamMember);
            if (res) {
                stdR = parseFloat(res.stdRate) || 50;
                ovtR = parseFloat(res.ovtRate) || 75;
                units = parseInt(res.maxUnits) || 100;
            }
        }

        stdRates.push(stdR);
        ovtRates.push(ovtR);
        maxUnitsArr.push(units);

        const cost = stdR * 8 * dur;
        baseCosts.push(cost);
        
        currentTotal += cost;
        cumulativeCosts.push(currentTotal);
        costPerDay.push(cost / dur);
    });

    if (currentAnalysisMode === 'bargraph') {
        analysisChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Duration (Days)', data: durations, backgroundColor: '#3b82f6', yAxisID: 'y' },
                    { label: 'Std Labor (Hours)', data: laborHours, backgroundColor: '#10b981', yAxisID: 'y' },
                    { label: 'Std Hourly Rate ($)', data: stdRates, backgroundColor: '#8b5cf6', yAxisID: 'y1' },
                    { label: 'Overtime Rate ($)', data: ovtRates, backgroundColor: '#ef4444', yAxisID: 'y1' }
                ]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Days / Hours' } },
                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Rates ($)' } }
                }
            }
        });

    } else if (currentAnalysisMode === 'graphs') {
        analysisChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Task Budget Share ($)',
                    data: baseCosts,
                    backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#f97316', '#14b8a6', '#475569', '#64748b']
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    tooltip: { callbacks: { label: function(context) { return '$' + context.raw.toLocaleString(); } } }
                }
            }
        });

    } else if (currentAnalysisMode === 'network') {
        analysisChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Cumulative Cost ($)', data: cumulativeCosts, borderColor: '#ef4444', fill: true, backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.4, yAxisID: 'y' },
                    { label: 'Daily Burn Rate ($/Day)', data: costPerDay, borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.4, yAxisID: 'y' },
                    { label: 'Resource Strain (%)', data: maxUnitsArr, borderColor: '#8b5cf6', tension: 0.4, yAxisID: 'y1' }
                ]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Cost ($)' } },
                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Strain (%)' } }
                }
            }
        });
    }
}

function backToAnalysisList() {
    document.getElementById('analysis-display-area').classList.add('hidden');
    document.getElementById('analysis-list-header').classList.remove('hidden');
    document.getElementById('analysis-project-list').classList.remove('hidden');
}

// --- SUPPORT LOGIC ---
function submitSupportQuery() {
    const subject = document.getElementById('support-subject').value.trim();
    const message = document.getElementById('support-message').value.trim();
    
    if (!subject || !message) {
        alert("Please provide both a subject and a message.");
        return;
    }
    
    alert("Thank you! Your query has been submitted. Our support team will contact you shortly.");
    document.getElementById('support-subject').value = '';
    document.getElementById('support-message').value = '';
}