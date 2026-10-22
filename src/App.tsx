import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from "react";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "Makanan" | "Minuman";
  accent: string;
  qty?: number;
};

type DrinkCustomization = {
  milk: "Fresh milk" | "Oat milk";
  sugar: "Less sugar" | "Normal" | "No sugar";
};

type DrinkSelection = {
  productId: number;
  milk: DrinkCustomization["milk"];
  sugar: DrinkCustomization["sugar"];
  qty: number;
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
    qty: 0,
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

const getStockLimit = (product: Product) =>
  product.category === "Makanan" ? 12 : 5;

const getDrinkMilkExtra = (milk: DrinkCustomization["milk"]) =>
  milk === "Oat milk" ? 5000 : 0;

const customizableProductIds = new Set([4, 6]);

const drinkBaseOptions: Record<number, DrinkCustomization> = {
  4: { milk: "Fresh milk", sugar: "Normal" },
  6: { milk: "Fresh milk", sugar: "Normal" },
};

function ActionButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

function QtyButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ActionButton
      {...props}
      className={`h-11 w-11 rounded-full border text-[22px] font-semibold ${className}`}
    />
  );
}

function AddButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ActionButton
      {...props}
      className={`h-10 w-full rounded-full bg-[#A63D56] text-sm text-[#FFF8EE] ${className}`}
    />
  );
}

const continueButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-full bg-[#F7ECDD] px-6 text-sm font-semibold text-[#4A2C22] no-underline transition";

function App() {
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>("Semua");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOptionTitle>(
    deliveryOptions[0].title,
  );
  const [items, setItems] = useState(products);
  const [customizerProductId, setCustomizerProductId] = useState<number | null>(
    null,
  );
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [customizerQty, setCustomizerQty] = useState(1);
  const [modalQty, setModalQty] = useState(1);
  const [drinkOptions, setDrinkOptions] =
    useState<Record<number, DrinkCustomization>>(drinkBaseOptions);
  const [drinkSelections, setDrinkSelections] = useState<DrinkSelection[]>([]);
  const [productOrderMap, setProductOrderMap] = useState<
    Record<number, number>
  >({});
  const orderCounterRef = useRef(0);

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

  const totalItems = items.reduce(
    (sum, product) => sum + (product.qty ?? 0),
    0,
  );

  const assignNewProductOrder = (productId: number) => {
    setProductOrderMap((current) => ({
      ...current,
      [productId]: orderCounterRef.current++,
    }));
  };

  const clearProductOrder = (productId: number) => {
    setProductOrderMap((current) => {
      if (!(productId in current)) return current;

      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const addDrinkSelection = (
    productId: number,
    milk: DrinkCustomization["milk"],
    sugar: DrinkCustomization["sugar"],
    qty: number,
  ) => {
    setDrinkSelections((current) => {
      const next = [...current];
      const matchingIndex = next.findIndex(
        (entry) =>
          entry.productId === productId &&
          entry.milk === milk &&
          entry.sugar === sugar,
      );

      if (matchingIndex >= 0) {
        next[matchingIndex] = {
          ...next[matchingIndex],
          qty: next[matchingIndex].qty + qty,
        };
        return next;
      }

      next.push({ productId, milk, sugar, qty });
      return next;
    });
  };

  const removeDrinkSelection = (
    productId: number,
    milk?: DrinkCustomization["milk"],
    sugar?: DrinkCustomization["sugar"],
  ) => {
    setDrinkSelections((current) => {
      const next = [...current];
      const targetIndex = next.findLastIndex(
        (entry) =>
          entry.productId === productId &&
          (milk === undefined || entry.milk === milk) &&
          (sugar === undefined || entry.sugar === sugar),
      );

      if (targetIndex < 0) return current;

      const selectedEntry = next[targetIndex];

      if (selectedEntry.qty > 1) {
        next[targetIndex] = {
          ...selectedEntry,
          qty: selectedEntry.qty - 1,
        };
      } else {
        next.splice(targetIndex, 1);
      }

      return next;
    });
  };

  const getProductOrder = (productId: number) => {
    if (productOrderMap[productId] !== undefined) {
      return productOrderMap[productId];
    }

    const nextOrder = orderCounterRef.current;
    orderCounterRef.current += 1;
    setProductOrderMap((current) => ({
      ...current,
      [productId]: nextOrder,
    }));

    return nextOrder;
  };

  const summaryEntries = useMemo(() => {
    const entries: Array<{
      productId: number;
      name: string;
      qty: number;
      price: number;
      milk?: DrinkCustomization["milk"];
      sugar?: DrinkCustomization["sugar"];
      order: number;
    }> = [];

    items.forEach((item) => {
      if ((item.qty ?? 0) <= 0) return;

      if (customizableProductIds.has(item.id)) {
        const variantEntries = drinkSelections.filter(
          (entry) => entry.productId === item.id,
        );

        if (variantEntries.length > 0) {
          variantEntries.forEach((entry) => {
            entries.push({
              productId: item.id,
              name: item.name,
              qty: entry.qty,
              price: item.price + getDrinkMilkExtra(entry.milk),
              milk: entry.milk,
              sugar: entry.sugar,
              order: productOrderMap[item.id] ?? getProductOrder(item.id),
            });
          });
          return;
        }
      }

      entries.push({
        productId: item.id,
        name: item.name,
        qty: item.qty ?? 0,
        price: item.price,
        order: productOrderMap[item.id] ?? getProductOrder(item.id),
      });
    });

    return entries.sort((a, b) => a.order - b.order);
  }, [drinkSelections, items, productOrderMap]);

  const subtotal = useMemo(
    () =>
      summaryEntries.reduce((sum, entry) => sum + entry.price * entry.qty, 0),
    [summaryEntries],
  );

  const updateQty = (id: number, delta: number) => {
    setItems((current) =>
      current.map((product) => {
        if (product.id !== id) return product;

        const currentQty = product.qty ?? 0;
        const maxQty = getStockLimit(product);

        if (delta > 0 && currentQty >= maxQty) return product;

        const nextQty = Math.max(0, currentQty + delta);

        if (currentQty === 0 && nextQty > 0) {
          assignNewProductOrder(id);
        }

        if (currentQty > 0 && nextQty === 0) {
          clearProductOrder(id);
        }

        return { ...product, qty: nextQty };
      }),
    );

    if (customizableProductIds.has(id) && delta < 0) {
      const variantEntries = drinkSelections.filter(
        (entry) => entry.productId === id,
      );
      const latestVariant = variantEntries[variantEntries.length - 1];

      if (latestVariant) {
        removeDrinkSelection(id, latestVariant.milk, latestVariant.sugar);
      }
    }
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

  const closeCustomizer = () => {
    if (!customizerProductId) return;

    setIsSheetClosing(true);
    const closeTimer = window.setTimeout(() => {
      setCustomizerProductId(null);
      setIsSheetClosing(false);
    }, 220);

    return () => window.clearTimeout(closeTimer);
  };

  useEffect(() => {
    document.body.style.overflow = customizerProductId ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [customizerProductId]);

  const selectedCustomizerProduct =
    customizerProductId !== null
      ? (items.find((product) => product.id === customizerProductId) ?? null)
      : null;

  const activeDrinkOptions =
    selectedCustomizerProduct &&
    customizableProductIds.has(selectedCustomizerProduct.id)
      ? (drinkOptions[selectedCustomizerProduct.id] ??
        drinkBaseOptions[selectedCustomizerProduct.id])
      : null;

  const openDrinkCustomizer = (product: Product) => {
    setIsSheetClosing(false);
    setCustomizerProductId(product.id);
    setCustomizerQty(1);
    setModalQty(Math.max(1, product.qty ?? 1));
  };

  const scrollToSummary = () => {
    const summaryEl = document.getElementById("ringkasan");
    if (!summaryEl) return;

    summaryEl.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const isCustomizableProduct = (product: Product) =>
    customizableProductIds.has(product.id);

  const applyDrinkCustomization = () => {
    if (!selectedCustomizerProduct) return;

    const options =
      drinkOptions[selectedCustomizerProduct.id] ??
      drinkBaseOptions[selectedCustomizerProduct.id];

    const wasInactive = (selectedCustomizerProduct.qty ?? 0) === 0;
    const baseQty = selectedCustomizerProduct.qty ?? 0;
    const nextQty = Math.min(
      baseQty + customizerQty,
      getStockLimit(selectedCustomizerProduct),
    );
    setItems((current) =>
      current.map((product) =>
        product.id === selectedCustomizerProduct.id
          ? { ...product, qty: nextQty }
          : product,
      ),
    );

    if (wasInactive) {
      assignNewProductOrder(selectedCustomizerProduct.id);
    }

    addDrinkSelection(
      selectedCustomizerProduct.id,
      options.milk,
      options.sugar,
      customizerQty,
    );

    closeCustomizer();
  };

  const updateDrinkOption = <Key extends keyof DrinkCustomization>(
    key: Key,
    value: DrinkCustomization[Key],
  ) => {
    if (!selectedCustomizerProduct) return;

    setDrinkOptions((current) => ({
      ...current,
      [selectedCustomizerProduct.id]: {
        ...(current[selectedCustomizerProduct.id] ??
          drinkBaseOptions[selectedCustomizerProduct.id]),
        [key]: value,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-[#F7ECDD] text-[#4A2C22]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#F7ECDD] shadow-[0_0_0_1px_rgba(74,44,34,0.08)]">
        <header className="flex items-center justify-between px-5 pb-5 pt-5">
          <div className="font-[Shrikhand] text-[30px] leading-none text-[#A63D56]">
            WeekendBite
          </div>
        </header>

        <section className="px-5 pt-2">
          <h1 className="font-[Young_Serif] text-[24px] leading-[35px] text-[#4A2C22]">
            Mau pesan apa weekend ini?
          </h1>
          <p className="mt-1 text-[15px] leading-6 text-[#4A3426]">
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
              onClick={() => openDrinkCustomizer(product)}
              className="flex h-[340px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[#E3D6C3] bg-[#FFFDF9]"
            >
              <div
                className={`flex h-[167px] items-center justify-center text-xs font-medium ${product.accent}`}
              >
                [foto]
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div className="h-6 overflow-hidden pt-1 text-ellipsis whitespace-nowrap font-[Young_Serif] text-[16px] leading-5 text-[#4A2C22]">
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
                      <QtyButton
                        type="button"
                        aria-label="Kurangi"
                        onClick={(event) => {
                          event.stopPropagation();

                          if (customizableProductIds.has(product.id)) {
                            const nextQty = Math.max(0, (product.qty ?? 0) - 1);
                            const variantEntries = drinkSelections.filter(
                              (entry) => entry.productId === product.id,
                            );
                            const latestVariant =
                              variantEntries[variantEntries.length - 1];

                            setItems((current) =>
                              current.map((item) =>
                                item.id === product.id
                                  ? { ...item, qty: nextQty }
                                  : item,
                              ),
                            );

                            if (latestVariant) {
                              removeDrinkSelection(
                                product.id,
                                latestVariant.milk,
                                latestVariant.sugar,
                              );
                            }
                            return;
                          }

                          updateQty(product.id, -1);
                        }}
                        className="border-[#A63D56] bg-[#FFFDF9] text-[#A63D56]"
                      >
                        −
                      </QtyButton>
                      <div className="min-w-[14px] text-center text-base font-semibold">
                        {product.qty ?? 0}
                      </div>
                      <QtyButton
                        type="button"
                        aria-label="Tambah"
                        onClick={(event) => {
                          event.stopPropagation();

                          if (customizableProductIds.has(product.id)) {
                            openDrinkCustomizer(product);
                            return;
                          }

                          updateQty(product.id, 1);
                        }}
                        disabled={(product.qty ?? 0) >= getStockLimit(product)}
                        className="border-[#A63D56] bg-[#FFFDF9] text-[#A63D56]"
                      >
                        +
                      </QtyButton>
                    </div>
                  ) : (
                    <AddButton
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        if (customizableProductIds.has(product.id)) {
                          openDrinkCustomizer(product);
                          return;
                        }

                        updateQty(product.id, 1);
                      }}
                      disabled={(product.qty ?? 0) >= getStockLimit(product)}
                    >
                      Tambah
                    </AddButton>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section id="data" className="mt-7 bg-[#FBF6EE] p-5">
          <div className="font-[Young_Serif] text-[20px] text-[#4A2C22]">
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

        <section id="ringkasan" className="scroll-mt-8 px-5 pb-4 pt-7">
          <div className="font-[Young_Serif] text-[20px] text-[#4A2C22]">
            Ringkasan
          </div>

          <div className="mt-4 rounded-[20px] border border-[#E3D6C3] bg-[#FFFDF9] p-4.5">
            <div className="space-y-3">
              {summaryEntries.map((entry) => {
                const selectedCustomization =
                  entry.productId === 6
                    ? entry.sugar
                    : entry.milk && entry.sugar
                      ? `${entry.milk}, ${entry.sugar}`
                      : "";

                return (
                  <div
                    key={`${entry.productId}-${entry.milk ?? "default"}-${entry.sugar ?? "default"}-${entry.qty}`}
                    className="flex items-center justify-between gap-3 text-[15px] text-[#4A2C22]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">
                        {entry.name} ×{entry.qty}
                      </div>
                      {selectedCustomization && (
                        <div className="text-[12px] text-[#4A3426]">
                          {selectedCustomization}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0">
                      {money.format((entry.price ?? 0) * entry.qty)}
                    </span>
                  </div>
                );
              })}
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

          <AddButton type="button" className="mt-5 h-14 text-base">
            Kirim Pesanan
          </AddButton>

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

        <div
          onClick={scrollToSummary}
          className="sticky bottom-0 z-20 mt-auto flex cursor-pointer items-center justify-between gap-3 rounded-t-[16px] bg-[#4A2C22] px-5 py-3 text-[#F7ECDD] shadow-[0_-2px_10px_rgba(74,44,34,0.12)]"
        >
          <div className="leading-tight">
            <div className="text-[13px]">{totalItems} item</div>
            <div className="text-[17px] font-semibold">
              {money.format(subtotal)}
            </div>
          </div>

          <a href="#data" className={continueButtonClassName}>
            Lanjut
          </a>
        </div>

        {selectedCustomizerProduct && (
          <div
            className={`fixed inset-0 z-50 flex items-end justify-center bg-[rgba(74,44,34,0.6)] px-0 py-0 transition-opacity duration-300 ${
              isSheetClosing ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            onClick={closeCustomizer}
          >
            <div
              className={`max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-[#FBF6EE] p-3 pb-5 shadow-[0_-10px_30px_rgba(74,44,34,0.15)] transition-transform duration-300 ease-out ${
                isSheetClosing ? "translate-y-[110%]" : "translate-y-0"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D9C7AE]" />

              <div className="h-[150px] rounded-[18px] bg-[#5E7A4E] text-center text-[13px] text-[#F7ECDD] flex items-center justify-center">
                [foto {selectedCustomizerProduct.name}]
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <div className="font-[Young_Serif] text-[26px] text-[#4A2C22]">
                    {selectedCustomizerProduct.name}
                  </div>
                  <div className="font-semibold text-[#4A2C22]">
                    {money.format(selectedCustomizerProduct.price)}
                  </div>
                </div>
                <div className="mt-1 text-[14px] leading-5 text-[#4A3426]">
                  {selectedCustomizerProduct.description}
                </div>
              </div>

              {isCustomizableProduct(selectedCustomizerProduct) ? (
                <>
                  <div className="mt-5 space-y-5">
                    {selectedCustomizerProduct.id !== 6 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[15px] font-semibold text-[#4A2C22]">
                          <span>Susu</span>
                          <span className="text-[12px] font-medium text-[#6B4F3C]">
                            Pilih 1
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              label: "Fresh milk",
                              value: "Fresh milk" as const,
                            },
                            {
                              label: "Oat milk",
                              value: "Oat milk" as const,
                              extra: "+Rp 5.000",
                            },
                          ].map((option) => {
                            const selected =
                              activeDrinkOptions?.milk === option.value;

                            return (
                              <label
                                key={option.label}
                                className={`relative flex h-[52px] cursor-pointer flex-col items-center justify-center rounded-[14px] border text-center text-[14px] font-semibold leading-tight transition ${
                                  selected
                                    ? "border-[#A63D56] bg-[#FBEFF1] text-[#A63D56]"
                                    : "border-[#D9C7AE] bg-[#FFFDF9] text-[#4A2C22]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="milk-option"
                                  checked={Boolean(selected)}
                                  onChange={() =>
                                    updateDrinkOption("milk", option.value)
                                  }
                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                                <span>{option.label}</span>
                                {option.extra && (
                                  <span className="text-[12px] font-medium">
                                    {option.extra}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[15px] font-semibold text-[#4A2C22]">
                        <span>Gula</span>
                        <span className="text-[12px] font-medium text-[#6B4F3C]">
                          Pilih 1
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(["No sugar", "Less sugar", "Normal"] as const).map(
                          (option) => {
                            const selected =
                              activeDrinkOptions?.sugar === option;

                            return (
                              <label
                                key={option}
                                className={`relative flex h-[52px] cursor-pointer items-center justify-center rounded-[14px] border text-center text-[14px] font-semibold transition ${
                                  selected
                                    ? "border-[#A63D56] bg-[#FBEFF1] text-[#A63D56]"
                                    : "border-[#D9C7AE] bg-[#FFFDF9] text-[#4A2C22]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="sugar-option"
                                  checked={Boolean(selected)}
                                  onChange={() =>
                                    updateDrinkOption("sugar", option)
                                  }
                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                                {option}
                              </label>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <QtyButton
                        type="button"
                        aria-label="Kurangi"
                        onClick={() =>
                          setCustomizerQty((value) => Math.max(1, value - 1))
                        }
                        className="border-[#A63D56] bg-[#FFFDF9] text-[#A63D56]"
                      >
                        −
                      </QtyButton>
                      <div className="min-w-[14px] text-center text-base font-semibold text-[#4A2C22]">
                        {customizerQty}
                      </div>
                      <QtyButton
                        type="button"
                        aria-label="Tambah"
                        onClick={() =>
                          setCustomizerQty((value) =>
                            Math.min(
                              getStockLimit(selectedCustomizerProduct),
                              value + 1,
                            ),
                          )
                        }
                        className="border-[#A63D56] bg-[#FFFDF9] text-[#A63D56]"
                      >
                        +
                      </QtyButton>
                    </div>

                    <AddButton
                      type="button"
                      onClick={applyDrinkCustomization}
                      className="h-[56px] text-base"
                    >
                      Tambah ·{" "}
                      {money.format(
                        (selectedCustomizerProduct.price +
                          getDrinkMilkExtra(
                            selectedCustomizerProduct.id === 6
                              ? "Fresh milk"
                              : (activeDrinkOptions?.milk ?? "Fresh milk"),
                          )) *
                          customizerQty,
                      )}
                    </AddButton>
                  </div>
                </>
              ) : (
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <QtyButton
                      type="button"
                      aria-label="Kurangi"
                      onClick={(event) => {
                        event.stopPropagation();
                        setModalQty((value) => Math.max(0, value - 1));
                      }}
                      className="border-[#A63D56] bg-[#FFFDF9] text-[#A63D56]"
                    >
                      −
                    </QtyButton>
                    <div className="min-w-[14px] text-center text-base font-semibold text-[#4A2C22]">
                      {modalQty}
                    </div>
                    <QtyButton
                      type="button"
                      aria-label="Tambah"
                      onClick={(event) => {
                        event.stopPropagation();
                        setModalQty((value) =>
                          Math.min(
                            getStockLimit(selectedCustomizerProduct),
                            value + 1,
                          ),
                        );
                      }}
                      className="border-[#A63D56] bg-[#FFFDF9] text-[#A63D56]"
                    >
                      +
                    </QtyButton>
                  </div>

                  <AddButton
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      const currentQty = selectedCustomizerProduct.qty ?? 0;
                      const delta = modalQty - currentQty;

                      if (delta !== 0) {
                        updateQty(selectedCustomizerProduct.id, delta);
                      }

                      closeCustomizer();
                    }}
                    className="h-[56px] text-base"
                  >
                    Tambah
                  </AddButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
