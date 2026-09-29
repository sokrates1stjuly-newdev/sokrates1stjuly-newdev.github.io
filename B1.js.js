const savedLibrary = localStorage.getItem("kho_truyen_data");
const state = {
  theme: localStorage.getItem("theme") || "dark",
  search: "",
  sort: "title",
  active: "all",
  selectedId: null,
  editingId: null,
  editingCabinetId: null,
  library: savedLibrary ? JSON.parse(savedLibrary) : {
    cabinets: [
      { id: "fav", name: "Yêu thích", isPinned: false }
    ],
    stories: []
  }
};

// TỰ ĐỘNG LÀM SẠCH: Loại bỏ các tủ trùng tên hoặc trùng ID "fav"
if (state.library && state.library.cabinets) {
  state.library.cabinets = state.library.cabinets.filter(c => c.id !== "fav" && c.name.trim().toLowerCase() !== "yêu thích");
  state.library.cabinets.unshift({ id: "fav", name: "Yêu thích", isPinned: false });
}

function saveData() {
  localStorage.setItem("kho_truyen_data", JSON.stringify(state.library));
}

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(title) {
  return (title || "").trim().slice(0, 2).toUpperCase() || "TR";
}

function render() {
  document.documentElement.setAttribute("data-theme", state.theme);
  
  const L = state.library || { cabinets: [], stories: [] };
  const q = state.search.trim().toLowerCase();

  // LỌC TRUYỆN
  let stories = (L.stories || []).filter(s => {
    const matchesSearch = !q || [s.title, s.description, s.author, s.genre].join(" ").toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (state.active === "all") return true;
    if (state.active === "fav") return !!s.isFavorite;
    return s.cabinetId === state.active;
  });

  stories.sort((a, b) => {
    if (state.sort === "title-desc") return (b.title || "").localeCompare(a.title || "");
    return (a.title || "").localeCompare(b.title || "");
  });

  // 1. Render Sidebar Nav
  const nav = document.getElementById("sidebar-nav");
  if (nav) {
    const defaultCabinets = L.cabinets.filter(c => c.id === "fav");
    const customCabinets = L.cabinets.filter(c => c.id !== "fav");

    customCabinets.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    nav.innerHTML = `
      <div class="nav-row">
        <button class="nav-item ${state.active === "all" ? "active" : ""}" data-cabinet="all">
          <span>📚 Tất cả</span>
        </button>
      </div>
      ${defaultCabinets.map(c => `
        <div class="nav-row">
          <button class="nav-item ${state.active === c.id ? "active" : ""}" data-cabinet="${esc(c.id)}">
            <span>❤️ ${esc(c.name)}</span>
          </button>
        </div>
      `).join("")}

      <div class="nav-divider"></div>

      ${customCabinets.map(c => `
        <div class="nav-row">
          <button class="nav-item ${state.active === c.id ? "active" : ""}" data-cabinet="${esc(c.id)}">
            <span>${c.isPinned ? '📌 ' : ''}${esc(c.name)}</span>
            <div class="cabinet-actions">
              <button class="cab-btn btn-pin-cab" data-id="${esc(c.id)}" title="${c.isPinned ? 'Bỏ ghim' : 'Ghim tủ'}">${c.isPinned ? '📌' : '📍'}</button>
              <button class="cab-btn btn-edit-cab" data-id="${esc(c.id)}" title="Sửa tủ">✏️</button>
              <button class="cab-btn danger btn-delete-cab" data-id="${esc(c.id)}" title="Xóa tủ">🗑️</button>
            </div>
          </button>
        </div>
      `).join("")}
    `;
  }

  // 2. Cập nhật Số lượng
  const countEl = document.getElementById("story-count");
  if (countEl) countEl.textContent = `Tổng: ${stories.length}`;

  // 3. Render Cards
  const container = document.getElementById("cards-container");
  const emptyStoryMsg = document.getElementById("empty-story-msg");

  if (container) {
    if (stories.length > 0) {
      container.innerHTML = stories.map(s => `
        <article class="card">
          <button data-select="${esc(s.id)}" style="all:unset;cursor:pointer;display:block;width:100%">
            <div class="cover" style="background:${esc(s.cover || '#0d9488')}">${esc(initials(s.title))}</div>
            <div class="card-main">
              <div class="card-title">${esc(s.title)}</div>
              <div class="author">${esc(s.author || 'Tác giả ẩn danh')}</div>
            </div>
          </button>
        </article>
      `).join("");
      if (emptyStoryMsg) emptyStoryMsg.style.display = "none";
    } else {
      container.innerHTML = "";
      if (emptyStoryMsg) emptyStoryMsg.style.display = "block";
    }
  }

  // 4. Render Chi tiết Truyện
  const detailsEl = document.getElementById("details-content");
  const emptyDetailMsg = document.getElementById("empty-detail-msg");

  const detail = (L.stories || []).find(s => s.id === state.selectedId);

  if (detailsEl) {
    if (detail) {
      detailsEl.innerHTML = `
        <div style="padding: 4px;">
          <div class="detail-header-row">
            <h2>${esc(detail.title)}</h2>
            <div class="detail-actions">
              <button class="icon-btn" id="btn-toggle-fav" title="Yêu thích">${detail.isFavorite ? "❤️" : "🤍"}</button>
              <button class="icon-btn" id="btn-edit-story" title="Sửa truyện">✏️</button>
              <button class="icon-btn danger" id="btn-delete-story" title="Xóa truyện">🗑️</button>
            </div>
          </div>
          <p style="margin:4px 0;"><strong>Tác giả:</strong> ${esc(detail.author) || "—"}</p>
          <p style="margin:4px 0;"><strong>Thể loại:</strong> ${esc(detail.genre) || "—"}</p>
          <p style="margin:12px 0 0;color:var(--muted);font-size:13px;line-height:1.5;">${esc(detail.description) || "Chưa có mô tả."}</p>
        </div>
      `;
      if (emptyDetailMsg) emptyDetailMsg.style.display = "none";

      document.getElementById("btn-toggle-fav")?.addEventListener("click", () => {
        detail.isFavorite = !detail.isFavorite;
        saveData();
        render();
      });

      document.getElementById("btn-edit-story")?.addEventListener("click", () => {
        openEditStoryModal(detail);
      });

      document.getElementById("btn-delete-story")?.addEventListener("click", () => {
        if (confirm(`Bạn có chắc chắn muốn xóa truyện "${detail.title}" không?`)) {
          state.library.stories = state.library.stories.filter(s => s.id !== state.selectedId);
          state.selectedId = null;
          saveData();
          render();
        }
      });

    } else {
      detailsEl.innerHTML = "";
      if (emptyDetailMsg) emptyDetailMsg.style.display = "block";
    }
  }
}

function openEditStoryModal(detail) {
  state.editingId = detail.id;
  document.getElementById("modal-story-title").textContent = "Sửa Thông Tin Truyện";
  document.getElementById("input-title").value = detail.title || "";
  document.getElementById("input-author").value = detail.author || "";
  document.getElementById("input-genre").value = detail.genre || "";
  document.getElementById("input-desc").value = detail.description || "";

  const cabinetSelect = document.getElementById("input-cabinet");
  if (cabinetSelect) {
    cabinetSelect.innerHTML = `
      <option value="">-- Không chọn tủ --</option>
      ${(state.library.cabinets || []).filter(c => c.id !== "fav").map(c => `
        <option value="${esc(c.id)}" ${detail.cabinetId === c.id ? "selected" : ""}>${esc(c.name)}</option>
      `).join("")}
    `;
  }

  document.getElementById("modal-story").style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  saveData();
  render();

  document.getElementById("search")?.addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });

  document.getElementById("sort")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", state.theme);
    render();
  });

  // Sự kiện Click
  document.addEventListener("click", (e) => {
    // Ghim tủ
    const pinBtn = e.target.closest(".btn-pin-cab");
    if (pinBtn) {
      e.stopPropagation();
      const cabId = pinBtn.dataset.id;
      const cab = state.library.cabinets.find(c => c.id === cabId);
      if (cab) {
        cab.isPinned = !cab.isPinned;
        saveData();
        render();
      }
      return;
    }

    // Sửa tủ
    const editBtn = e.target.closest(".btn-edit-cab");
    if (editBtn) {
      e.stopPropagation();
      const cabId = editBtn.dataset.id;
      const cab = state.library.cabinets.find(c => c.id === cabId);
      if (cab) {
        state.editingCabinetId = cabId;
        document.getElementById("input-edit-cabinet-name").value = cab.name;
        document.getElementById("modal-edit-cabinet").style.display = "flex";
      }
      return;
    }

    // Xóa tủ
    const deleteBtn = e.target.closest(".btn-delete-cab");
    if (deleteBtn) {
      e.stopPropagation();
      const cabId = deleteBtn.dataset.id;
      const cab = state.library.cabinets.find(c => c.id === cabId);
      if (cab && confirm(`Bạn có chắc chắn muốn xóa tủ "${cab.name}"? (Các truyện trong tủ này sẽ không bị xóa)`)) {
        state.library.stories.forEach(s => {
          if (s.cabinetId === cabId) s.cabinetId = "";
        });
        state.library.cabinets = state.library.cabinets.filter(c => c.id !== cabId);
        if (state.active === cabId) state.active = "all";
        saveData();
        render();
      }
      return;
    }

    // Chọn tủ
    const cabBtn = e.target.closest("[data-cabinet]");
    if (cabBtn) {
      state.active = cabBtn.dataset.cabinet;
      render();
      return;
    }

    // Chọn truyện
    const selectBtn = e.target.closest("[data-select]");
    if (selectBtn) {
      state.selectedId = selectBtn.dataset.select;
      render();
    }
  });

  // Modals & Events
  const modalStory = document.getElementById("modal-story");
  const modalCabinet = document.getElementById("modal-cabinet");
  const modalEditCabinet = document.getElementById("modal-edit-cabinet");

  document.getElementById("btn-add-story")?.addEventListener("click", () => {
    state.editingId = null;
    document.getElementById("modal-story-title").textContent = "Thêm Truyện Mới";
    document.getElementById("input-title").value = "";
    document.getElementById("input-author").value = "";
    document.getElementById("input-genre").value = "";
    document.getElementById("input-desc").value = "";

    const cabinetSelect = document.getElementById("input-cabinet");
    if (cabinetSelect) {
      cabinetSelect.innerHTML = `
        <option value="">-- Không chọn tủ --</option>
        ${(state.library.cabinets || []).filter(c => c.id !== "fav").map(c => `
          <option value="${esc(c.id)}" ${state.active === c.id ? "selected" : ""}>${esc(c.name)}</option>
        `).join("")}
      `;
    }
    modalStory.style.display = "flex";
  });

  document.getElementById("close-modal-story")?.addEventListener("click", () => {
    modalStory.style.display = "none";
  });

  document.getElementById("btn-add-cabinet")?.addEventListener("click", () => {
    modalCabinet.style.display = "flex";
  });

  document.getElementById("close-modal-cabinet")?.addEventListener("click", () => {
    modalCabinet.style.display = "none";
  });

  document.getElementById("close-modal-edit-cabinet")?.addEventListener("click", () => {
    modalEditCabinet.style.display = "none";
  });

  // Lưu sửa tủ
  document.getElementById("save-edit-cabinet")?.addEventListener("click", () => {
    const name = document.getElementById("input-edit-cabinet-name").value.trim();
    if (!name) {
      alert("Vui lòng nhập tên tủ!");
      return;
    }

    const cab = state.library.cabinets.find(c => c.id === state.editingCabinetId);
    if (cab) {
      cab.name = name;
      saveData();
      render();
    }
    modalEditCabinet.style.display = "none";
  });

  // Lưu truyện
  document.getElementById("save-story")?.addEventListener("click", () => {
    const title = document.getElementById("input-title").value.trim();
    if (!title) {
      alert("Vui lòng nhập tên truyện!");
      return;
    }

    if (state.editingId) {
      const story = state.library.stories.find(s => s.id === state.editingId);
      if (story) {
        story.title = title;
        story.author = document.getElementById("input-author").value.trim();
        story.genre = document.getElementById("input-genre").value.trim();
        story.description = document.getElementById("input-desc").value.trim();
        story.cabinetId = document.getElementById("input-cabinet").value;
      }
    } else {
      const newStory = {
        id: "story-" + Date.now(),
        title: title,
        author: document.getElementById("input-author").value.trim(),
        genre: document.getElementById("input-genre").value.trim(),
        description: document.getElementById("input-desc").value.trim(),
        cabinetId: document.getElementById("input-cabinet").value,
        cover: "#0d9488",
        isFavorite: false
      };
      state.library.stories.push(newStory);
      state.selectedId = newStory.id;
    }

    saveData();
    render();
    modalStory.style.display = "none";
  });

  // Lưu thêm tủ mới
  document.getElementById("save-cabinet")?.addEventListener("click", () => {
    const name = document.getElementById("input-cabinet-name").value.trim();
    if (!name) {
      alert("Vui lòng nhập tên tủ truyện!");
      return;
    }

    const newCabinet = {
      id: "cab-" + Date.now(),
      name: name,
      isPinned: false
    };

    state.library.cabinets.push(newCabinet);
    state.active = newCabinet.id;
    saveData();
    render();

    document.getElementById("input-cabinet-name").value = "";
    modalCabinet.style.display = "none";
  });
});