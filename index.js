import { getRequestHeaders } from "../../../../script.js";
import { getWorldInfoPrompt, world_names, deleteWorldInfo } from "../../../world-info.js";

const extensionName = "lore-manager";

// Загрузить список всех лорбуков из глобального массива ST
function getAllLorebooks() {
    try {
        if (Array.isArray(world_names)) {
            return [...world_names];
        }
        return [];
    } catch (err) {
        console.error(`[${extensionName}]`, err);
        return [];
    }
}

// Обновить счётчик
function updateCount() {
    const total = $("#lore-manager-list .lore-manager-item").length;
    const selected = $("#lore-manager-list input:checked").length;
    $("#lore-manager-count").text(`Лорбуков: ${total} | Выбрано: ${selected}`);
}

// Отрисовать список
function renderList(lorebooks) {
    const $list = $("#lore-manager-list");
    $list.empty();

    if (!lorebooks || lorebooks.length === 0) {
        $list.append('<div class="lore-manager-empty">Лорбуки не найдены</div>');
        updateCount();
        return;
    }

    lorebooks.forEach((name) => {
        const safeId = `lore-cb-${name.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const $item = $(`
            <div class="lore-manager-item">
                <input type="checkbox" id="${safeId}" data-name="${name}" />
                <label for="${safeId}">${name}</label>
            </div>
        `);
        $item.find("input").on("change", updateCount);
        $list.append($item);
    });

    updateCount();
}

// Обновить список
function refreshList() {
    const lorebooks = getAllLorebooks();
    renderList(lorebooks);
}

// Удалить выбранные
async function deleteSelected() {
    const $checked = $("#lore-manager-list input:checked");
    if ($checked.length === 0) {
        toastr.warning("Ничего не выбрано", "Lore Book Manager");
        return;
    }

    const names = [];
    $checked.each(function () {
        names.push($(this).data("name"));
    });

    const confirmed = confirm(`Удалить ${names.length} лорбук(ов)?\n\n${names.join("\n")}`);
    if (!confirmed) return;

    let ok = 0;
    let fail = 0;

    for (const name of names) {
        try {
            // Используем встроенную функцию ST
            await deleteWorldInfo(name);
            ok++;
        } catch (err) {
            console.error(`[${extensionName}] Ошибка удаления "${name}":`, err);
            fail++;
        }
    }

    if (ok > 0) toastr.success(`Удалено: ${ok}`, "Lore Book Manager");
    if (fail > 0) toastr.error(`Не удалось удалить: ${fail}`, "Lore Book Manager");

    refreshList();
}

// Инициализация
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
    try {
        const html = `
        <div class="lore-manager-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>📚 Lore Book Manager</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="lore-manager-toolbar">
                        <button id="lore-manager-refresh" class="menu_button">
                            <i class="fa-solid fa-rotate-right"></i> Обновить
                        </button>
                        <button id="lore-manager-select-all" class="menu_button">
                            <i class="fa-solid fa-check-double"></i> Выбрать все
                        </button>
                        <button id="lore-manager-deselect-all" class="menu_button">
                            <i class="fa-solid fa-xmark"></i> Снять все
                        </button>
                        <button id="lore-manager-delete" class="menu_button" style="background:var(--SmartThemeRedColor,#c0392b)">
                            <i class="fa-solid fa-trash"></i> Удалить выбранные
                        </button>
                    </div>
                    <div class="lore-manager-count" id="lore-manager-count">Лорбуков: 0 | Выбрано: 0</div>
                    <div class="lore-manager-list" id="lore-manager-list">
                        <div class="lore-manager-empty">Нажмите «Обновить» для загрузки списка</div>
                    </div>
                </div>
            </div>
        </div>`;

        $("#extensions_settings2").append(html);

        $("#lore-manager-refresh").on("click", refreshList);
        $("#lore-manager-select-all").on("click", () => {
            $("#lore-manager-list input[type=checkbox]").prop("checked", true);
            updateCount();
        });
        $("#lore-manager-deselect-all").on("click", () => {
            $("#lore-manager-list input[type=checkbox]").prop("checked", false);
            updateCount();
        });
        $("#lore-manager-delete").on("click", deleteSelected);

        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed:`, error);
    }
});
