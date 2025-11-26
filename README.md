# Front_End

### 1) Cấu trúc thư mục `src`

- **`assets/`**: Chứa tài nguyên tĩnh (phông chữ, biểu tượng, hình ảnh). Không chứa logic.
- **`components/`**: Các thành phần UI có thể tái sử dụng, được nhóm theo miền nghiệp vụ:
  - `General/`: thành phần chung như `header.jsx`, `footer.jsx`.
  - Các thư mục khác (ví dụ `User_Management/`, `TestOrder_Management/`...) để đặt component theo chức năng.
- **`hooks/`**: Custom hooks dùng lại trong nhiều nơi (xem mục 2 bên dưới).
- **`layouts/`**: Component khung trang như `Main_layout.jsx`, `Dashboard_layout.jsx` dùng để bọc trang và sắp xếp bố cục.
- **`pages/`**: Các trang điều hướng được, ví dụ `Login.jsx`.
- **`routes/`**: Khai báo định tuyến cấp ứng dụng, ví dụ `App_Route.jsx`.
- **`services/`**: Giao tiếp API, cấu hình HTTP client (xem mục 3 bên dưới).
- **`store/`**: Trạng thái toàn cục sử dụng Zustand cho các miền dữ liệu (xem mục 4 bên dưới).
- **`utils/`**: Hàm tiện ích dùng chung.
- **`index.css`**: CSS gốc, thường kết hợp Tailwind.
- **`main.jsx`**: Điểm vào React, render ứng dụng vào DOM.
- **`App.jsx`**: Component gốc của ứng dụng, thường đặt bố cục và router.

### 2) Hooks

- **`useAuth`** (`hooks/useAuth.js`)
  - Quản lý trạng thái phiên đăng nhập tối giản ở client.
  - Lưu thông tin `user` vào `localStorage` khi `login`, xóa khi `logout`.
  - Trả về `{ user, login, logout, isAuthenticated }` để dùng trong component.

  Ví dụ:
  ```jsx
  import { useAuth } from "./src/hooks/useAuth";

  function Profile() {
    const { user, login, logout, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
      return (
        <button onClick={() => login({ id: 1, name: "Alice" })}>Login</button>
      );
    }
    return (
      <div>
        <p>Hello, {user.name}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  ```

- **`useFetch`** (`hooks/useFetch.js`)
  - Thực hiện gọi `fetch` đơn giản với `AbortController` để hủy khi unmount/thay đổi URL.
  - Quản lý vòng đời tải dữ liệu với ba trạng thái: `data`, `loading`, `error`.
  - Cách dùng: truyền `url` (và `options` nếu cần); khi `url` thay đổi sẽ tự gọi lại.

  Ví dụ:
  ```jsx
  import { useFetch } from "./src/hooks/useFetch";

  function Users() {
    const { data, loading, error } = useFetch("/api/users");

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;
    return (
      <ul>
        {data.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    );
  }
  ```

- **`useOutsideClick`** (`hooks/useOutsideClick.js`)
  - Trả về một `ref`; khi người dùng click ra ngoài phần tử gán `ref`, callback `handler` sẽ được gọi.
  - Hữu ích cho dropdown, modal, popover.

  Ví dụ:
  ```jsx
  import { useState } from "react";
  import { useOutsideClick } from "./src/hooks/useOutsideClick";

  function Dropdown() {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClick(() => setOpen(false));

    return (
      <div>
        <button onClick={() => setOpen((o) => !o)}>Toggle</button>
        {open && (
          <div ref={ref} style={{ border: "1px solid #ccc", padding: 8 }}>
            Content here
          </div>
        )}
      </div>
    );
  }
  ```

- **`usePagination`** (`hooks/usePagination.js`)
  - Cung cấp trạng thái phân trang tối giản dựa trên `totalItems` và `itemsPerPage`.
  - Trả về `{ currentPage, totalPages, nextPage, prevPage, goToPage, startIndex, endIndex }` để cắt mảng hiển thị.

  Ví dụ:
  ```jsx
  import { usePagination } from "./src/hooks/usePagination";

  function List({ items }) {
    const pageSize = 5;
    const { currentPage, totalPages, nextPage, prevPage, startIndex, endIndex } =
      usePagination(items.length, pageSize);

    const pageItems = items.slice(startIndex, endIndex);
    return (
      <div>
        <ul>
          {pageItems.map((it) => (
            <li key={it.id}>{it.name}</li>
          ))}
        </ul>
        <button onClick={prevPage} disabled={currentPage === 1}>
          Prev
        </button>
        <span>
          {currentPage}/{totalPages}
        </span>
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    );
  }
  ```

- **`useWindowSize`** (`hooks/useWindowSize.js`)
  - Theo dõi kích thước cửa sổ trình duyệt, cập nhật khi resize.
  - Trả về `{ width, height }` để responsive UI.

  Ví dụ:
  ```jsx
  import { useWindowSize } from "./src/hooks/useWindowSize";

  function ResponsiveBox() {
    const { width, height } = useWindowSize();
    return (
      <div>
        <p>Viewport: {width} x {height}</p>
        <div style={{ width: Math.min(width, 600), height: 200, background: "#eef" }} />
      </div>
    );
  }
  ```


### 3) Service

- **`services/api.js`**
  - Tạo một `axios` instance mặc định cho toàn ứng dụng.
  - `baseURL`:
    - Ở môi trường production (`import.meta.env.PROD === true`): dùng biến môi trường `VITE_API_BASE_URL`.
    - Ở môi trường phát triển: trỏ tới `"/api"` (thường dùng kèm proxy trong `vite.config.js`).
  - Thiết lập header mặc định `Content-Type: application/json`.
  - Gợi ý mở rộng: có thể thêm interceptors để tự gắn `Authorization` từ store, hoặc xử lý làm mới token/tập trung hóa xử lý lỗi.


### 4) Store (Zustand)

- **`store/authStore.js`**
  - Trạng thái xác thực: `{ user, token, isAuthenticated }`.
  - Action: `login(user, token)` để set trạng thái đăng nhập; `logout()` để xóa.

  Ví dụ:
  ```jsx
  import { useAuthStore } from "./src/store/authStore";

  function NavBar() {
    const { user, isAuthenticated, login, logout } = useAuthStore();
    return (
      <nav>
        {isAuthenticated ? (
          <>
            <span>{user?.name}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <button onClick={() => login({ id: 1, name: "Alice" }, "fake-token")}>Login</button>
        )}
      </nav>
    );
  }
  ```

- **`store/patientStore.js`**
  - Quản lý danh sách bệnh nhân và bệnh nhân được chọn: `{ patients, selectedPatient }`.
  - Action: `setPatients(data)`, `selectPatient(patient)`, `clearSelected()`.

  Ví dụ:
  ```jsx
  import { usePatientStore } from "./src/store/patientStore";

  function PatientList() {
    const { patients, selectedPatient, setPatients, selectPatient, clearSelected } = usePatientStore();

    // Giả sử bạn đã fetch dữ liệu ở nơi khác và gọi setPatients(data)
    return (
      <div>
        <ul>
          {patients.map((p) => (
            <li key={p.id} onClick={() => selectPatient(p)} style={{ cursor: "pointer" }}>
              {p.name}
            </li>
          ))}
        </ul>
        {selectedPatient && (
          <div>
            <h4>Đang chọn: {selectedPatient.name}</h4>
            <button onClick={clearSelected}>Bỏ chọn</button>
          </div>
        )}
      </div>
    );
  }
  ```

- **`store/testOrderStore.js`**
  - Quản lý danh sách phiếu xét nghiệm và cờ tải: `{ orders, loading }`.
  - Action: `setOrders(orders)`, `setLoading(loading)`.

  Ví dụ:
  ```jsx
  import { useEffect } from "react";
  import { useTestOrderStore } from "./src/store/testOrderStore";
  import api from "./src/services/api";

  function TestOrders() {
    const { orders, loading, setOrders, setLoading } = useTestOrderStore();

    useEffect(() => {
      async function load() {
        setLoading(true);
        try {
          const res = await api.get("/test-orders");
          setOrders(res.data);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [setLoading, setOrders]);

    if (loading) return <p>Loading...</p>;
    return (
      <ul>
        {orders.map((o) => (
          <li key={o.id}>{o.code}</li>
        ))}
      </ul>
    );
  }
  ```


### 5) Gợi ý tích hợp nhanh

- Khi gọi API có xác thực, có thể kết hợp `useAuthStore` để lấy `token` và gắn vào header thông qua axios interceptors ở `services/api.js`.
- Với danh sách dài, dùng `useFetch` + `usePagination` để tải và phân trang ở client; hoặc đẩy tham số phân trang lên API nếu backend hỗ trợ.
- Cho các thành phần popover/modal, áp dụng `useOutsideClick` để đóng khi click ra ngoài.
