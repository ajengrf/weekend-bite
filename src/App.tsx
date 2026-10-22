import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "Makanan" | "Minuman";
  accent: string;
  qty?: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "Red Velvet Cookies",
    description:
      "Red velvet cookie with white chocolate and cream cheese filling",
    price: 15000,
    category: "Makanan",
    accent: "bg-[#E9B872] text-[#4A2C22]",
    qty: 2,
  },
  {
    id: 2,
    name: "Brownies",
    description: "Rich cacao brownie with fudgy center and caramel notes",
    price: 30000,
    category: "Makanan",
    accent: "bg-[#6B4636] text-[#F7ECDD]",
    qty: 0,
  },
  {
    id: 3,
    name: "Tiramisu",
    description: "Creamy tiramisu layered with espresso and cocoa powder",
    price: 20000,
    category: "Makanan",
    accent: "bg-[#E8D5B8] text-[#4A2C22]",
    qty: 0,
  },
  {
    id: 4,
    name: "Matcha",
    description: "Iced matcha with oat milk and lightly sweet finish",
    price: 30000,
    category: "Minuman",
    accent: "bg-[#5E7A4E] text-[#F7ECDD]",
    qty: 0,
  },
  {
    id: 5,
    name: "Cold Brew",
    description: "Cold brew coffee with smooth chocolate undertone",
    price: 20000,
    category: "Minuman",
    accent: "bg-[#4A2C22] text-[#F7ECDD]",
    qty: 0,
  },
  {
    id: 6,
    name: "Strawberry Milk",
    description: "Fresh strawberry milk with creamy vanilla finish",
    price: 20000,
    category: "Minuman",
    accent: "bg-[#F4C6CC] text-[#4A2C22]",
    qty: 0,
  },
];

const categories = ["Semua", "Makanan", "Minuman"] as const;

type DeliveryOptionTitle =
  | "Ambil di tempat kami"
  | "Delivery online"
  | "Ambil di kantor";

const deliveryOptions: { title: DeliveryOptionTitle; detail: string }[] = [
  { title: "Ambil di tempat kami", detail: "Kamis–Minggu · Pasar Minggu" },
  {
    title: "Delivery online",
    detail: "Kamis–Minggu · kurir dipesan sendiri oleh kamu",
  },
  { title: "Ambil di kantor", detail: "Senin–Rabu · Arkadia Green Park" },
];

const dayNames = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

const getNextDateForDay = (dayName: string, from = new Date()) => {
  const targetIndex = dayNames.indexOf(dayName as (typeof dayNames)[number]);
  const currentIndex = (from.getDay() + 6) % 7;
  let diff = targetIndex - currentIndex;

  if (diff < 0) {
    diff += 7;
  }

  const nextDate = new Date(from);
  nextDate.setHours(0, 0, 0, 0);
  nextDate.setDate(from.getDate() + diff);
  return nextDate;
};

const getAvailableDays = (delivery: DeliveryOptionTitle) => {
  const availableDayNames =
    delivery === "Ambil di kantor"
      ? ["Senin", "Selasa", "Rabu"]
      : ["Kamis", "Jumat", "Sabtu", "Minggu"];

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return availableDayNames
    .map((dayName) => {
      const date = getNextDateForDay(dayName, today);
      const isSameDay = date.toDateString() === today.toDateString();
      const isPastCutoff = isSameDay && now.getHours() >= 12;

      return {
        day: dayName,
        date,
        disabled: date < today || isPastCutoff,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function App() {
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>("Semua");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOptionTitle>(
    deliveryOptions[0].title,
  );
  const [items, setItems] = useState(products);

  const availableDays = useMemo(
    () => getAvailableDays(selectedDelivery),
    [selectedDelivery],
  );

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const firstEnabled = getAvailableDays("Ambil di tempat kami").find(
      (option) => !option.disabled,
    );
    return firstEnabled?.day ?? "Kamis";
  });

  const visibleProducts =
    selectedCategory === "Semua"
      ? items
      : items.filter((product) => product.category === selectedCategory);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, product) => sum + product.price * (product.qty ?? 0),
        0,
      ),
    [items],
  );

  const totalItems = items.reduce(
    (sum, product) => sum + (product.qty ?? 0),
    0,
  );

  const updateQty = (id: number, delta: number) => {
    setItems((current) =>
      current.map((product) => {
        if (product.id !== id) return product;
        const nextQty = Math.max(0, (product.qty ?? 0) + delta);
        return { ...product, qty: nextQty };
      }),
    );
  };

  const handleDeliveryChange = (title: DeliveryOptionTitle) => {
    setSelectedDelivery(title);
    const nextAvailableDays = getAvailableDays(title);
    const firstEnabled = nextAvailableDays.find((option) => !option.disabled);
    setSelectedDay((current) => {
      const dayExists = nextAvailableDays.some(
        (option) => option.day === current && !option.disabled,
      );
      return dayExists ? current : (firstEnabled?.day ?? current);
    });
  };

  return (
    <div className="min-h-screen bg-[#F7ECDD] text-[#4A2C22]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#F7ECDD] shadow-[0_0_0_1px_rgba(74,44,34,0.08)]">
        <header className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="font-[Fraunces] text-[26px] italic font-bold text-[#A63D56]">
            WeekendBite
          </div>
        </header>

        <section className="px-5 pt-2">
          <h1 className="font-[Young_Serif] text-[30px] leading-[35px] text-[#4A2C22]">
            Mau pesan apa weekend ini?
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-[#4A3426]">
            Pilih produk dan isi data pesanan.
          </p>
        </section>

        <div className="mt-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex-none rounded-full border px-5 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[#A63D56] bg-[#A63D56] text-[#FFF8EE]"
                    : "border-[#A63D56] bg-transparent text-[#A63D56]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 px-5">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="flex h-[340px] flex-col overflow-hidden rounded-[20px] border border-[#E3D6C3] bg-[#FFFDF9]"
            >
              <div
                className={`flex h-[167px] items-center justify-center text-xs font-medium ${product.accent}`}
              >
                [foto]
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div className="flex h-6 items-end pt-1 font-[Young_Serif] text-[16px] leading-5 text-[#4A2C22]">
                  {product.name}
                </div>

                <p className="mt-1 line-clamp-2 h-[34px] text-[13px] leading-[17px] text-[#4A3426]">
                  {product.description}
                </p>

                <div className="mt-2 text-[14px] font-semibold text-[#4A2C22]">
                  {money.format(product.price)}
                </div>

                <div className="mt-auto pt-2">
                  {(product.qty ?? 0) > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        aria-label="Kurangi"
                        onClick={() => updateQty(product.id, -1)}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A63D56] bg-[#FFFDF9] text-[22px] font-semibold text-[#A63D56]"
                      >
                        −
                      </button>
                      <div className="min-w-[14px] text-center text-base font-semibold">
                        {product.qty ?? 0}
                      </div>
                      <button
                        type="button"
                        aria-label="Tambah"
                        onClick={() => updateQty(product.id, 1)}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A63D56] bg-[#FFFDF9] text-[22px] font-semibold text-[#A63D56]"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, 1)}
                      className="h-10 w-full rounded-full bg-[#A63D56] text-sm font-semibold text-[#FFF8EE]"
                    >
                      Tambah
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section id="data" className="mt-7 bg-[#FBF6EE] p-5">
          <div className="font-[Young_Serif] text-[24px] text-[#4A2C22]">
            Data pemesan
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="nama"
                className="text-sm font-semibold text-[#4A2C22]"
              >
                Nama
              </label>
              <input
                id="nama"
                type="text"
                placeholder="Nama kamu"
                className="h-[52px] w-full rounded-[14px] border border-[#D9C7AE] bg-[#FFFDF9] px-3.5 text-base text-[#4A2C22] outline-none placeholder:text-[#8C7268]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="wa"
                className="text-sm font-semibold text-[#4A2C22]"
              >
                Nomor WhatsApp
              </label>
              <input
                id="wa"
                type="tel"
                placeholder="08xx xxxx xxxx"
                className="h-[52px] w-full rounded-[14px] border border-[#D9C7AE] bg-[#FFFDF9] px-3.5 text-base text-[#4A2C22] outline-none placeholder:text-[#8C7268]"
              />
              <p className="text-[13px] text-[#4A3426]">
                Untuk konfirmasi pesanan
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-[#4A2C22]">
                Cara terima pesanan
              </div>

              {deliveryOptions.map((option) => {
                const selected = selectedDelivery === option.title;

                return (
                  <label
                    key={option.title}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                      selected
                        ? "border-[#A63D56] bg-[#FBEFF1]"
                        : "border-[#D9C7AE] bg-[#FFFDF9]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="terima"
                      checked={selected}
                      onChange={() => handleDeliveryChange(option.title)}
                      className="mt-0.5 h-5 w-5 accent-[#A63D56]"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="text-[15px] font-semibold text-[#4A2C22]">
                        {option.title}
                      </span>
                      <span className="text-[13px] text-[#4A3426]">
                        <b>
                          {option.title === "Ambil di tempat kami"
                            ? "Kamis–Minggu"
                            : option.title === "Delivery online"
                              ? "Kamis–Minggu"
                              : "Senin–Rabu"}
                        </b>{" "}
                        · {option.detail.replace(/^.*·\s/, "")}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-[#4A2C22]">
                Pilih hari
              </div>
              <div className="grid grid-cols-4 gap-2">
                {availableDays.map(({ day, date, disabled }) => {
                  const active = selectedDay === day && !disabled;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => !disabled && setSelectedDay(day)}
                      disabled={disabled}
                      className={`h-[56px] rounded-[14px] border text-[14px] font-semibold leading-tight ${
                        disabled
                          ? "cursor-not-allowed border-[#D9C7AE] bg-[#F3E9DE] text-[#B59E8A]"
                          : active
                            ? "border-[#A63D56] bg-[#A63D56] text-[#FFF8EE]"
                            : "border-[#A63D56] bg-[#FFFDF9] text-[#A63D56]"
                      }`}
                    >
                      {day}
                      <br />
                      <span className="text-[12px] font-medium">
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "numeric",
                          month: "short",
                        }).format(date)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] text-[#4A3426]">
                Hari yang tersedia mengikuti cara terima yang dipilih.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-4 pt-7">
          <div className="font-[Young_Serif] text-[24px] text-[#4A2C22]">
            Ringkasan
          </div>

          <div className="mt-4 rounded-[20px] border border-[#E3D6C3] bg-[#FFFDF9] p-4.5">
            <div className="space-y-3">
              {items
                .filter((item) => (item.qty ?? 0) > 0)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-[15px] text-[#4A2C22]"
                  >
                    <span>
                      {item.name} ×{item.qty ?? 0}
                    </span>
                    <span>
                      {money.format((item.price ?? 0) * (item.qty ?? 0))}
                    </span>
                  </div>
                ))}
              <div className="flex items-center justify-between text-[15px] text-[#4A2C22]">
                <span>Pembayaran</span>
                <span>QRIS</span>
              </div>
            </div>

            <div className="mt-3 border-t border-[#E3D6C3] pt-3 font-semibold text-[#4A2C22]">
              <div className="flex items-center justify-between text-[15px]">
                <span>Total</span>
                <span>{money.format(subtotal)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-5 h-14 w-full rounded-full bg-[#A63D56] text-base font-semibold text-[#FFF8EE]"
          >
            Kirim Pesanan
          </button>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-[#4A3426]">
            <a
              href="https://www.instagram.com/getweekendbite"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-semibold text-[#A63D56]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#A63D56] text-[#FFF8EE] shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 fill-current"
                >
                  <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5Zm5.25-3.25a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Z" />
                </svg>
              </span>
              @getweekendbite
            </a>
          </p>
        </section>

        <div className="sticky bottom-0 z-20 mt-auto flex items-center justify-between gap-3 rounded-t-[16px] bg-[#4A2C22] px-5 py-3 text-[#F7ECDD] shadow-[0_-2px_10px_rgba(74,44,34,0.12)]">
          <div className="leading-tight">
            <div className="text-[13px]">{totalItems} item</div>
            <div className="text-[17px] font-semibold">
              {money.format(subtotal)}
            </div>
          </div>

          <a
            href="#data"
            className="flex h-10 items-center rounded-full bg-[#F7ECDD] px-6 text-sm font-semibold text-[#4A2C22] no-underline"
          >
            Lanjut
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
