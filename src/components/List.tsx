import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";
import GifSkeleton from "./GifSkeleton";
import useGifs from "../hooks/useGifs";

const List = () => {
  // Refs
  const lastGifRef = useRef<HTMLLIElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fetchingRef = useRef<boolean>(false); // ✅ verrou local anti-spam

  // States
  const [querySearch, setQuerySearch] = useState<string>("zywoo");
  const [pageNumber, setPageNumber] = useState<number>(0);

  // Custom Hooks
  const apiGifsData = useGifs(querySearch, pageNumber);

  useEffect(() => {
    if (apiGifsData.loading || apiGifsData.gifs.length === 0) return;

    const currentLastGifRef = lastGifRef.current;

    if (observerRef.current && currentLastGifRef) {
      observerRef.current.unobserve(currentLastGifRef);
    }

    // On attend la stabilisation du DOM (évite le multi-trigger)
    queueMicrotask(() => {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          if (
            entry.isIntersecting &&
            !fetchingRef.current &&
            !apiGifsData.loading &&
            !apiGifsData.endReached
          ) {
            fetchingRef.current = true;
            setPageNumber((prev) => prev + 1);
          }
        },
        { rootMargin: "300px" }
      );

      if (currentLastGifRef) {
        observerRef.current.observe(currentLastGifRef);
      }
    });

    return () => {
      if (observerRef.current && currentLastGifRef) {
        observerRef.current.unobserve(currentLastGifRef);
      }
    };
  }, [apiGifsData.gifs, apiGifsData.loading, apiGifsData.endReached]);

  // 🔄 On met à jour le verrou local dès que le chargement se termine
  useEffect(() => {
    if (!apiGifsData.loading) fetchingRef.current = false;
  }, [apiGifsData.loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.current !== null && searchRef.current.value !== querySearch) {
      setPageNumber(0);
      setQuerySearch(searchRef.current.value);
    }
  };

  return (
    <>
      <h1 className="text-4xl">GIF FINDER</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mb-4" htmlFor="gifSearch">
          Looking for gifs...
        </label>

        <input
          ref={searchRef}
          type="text"
          placeholder="Looking for something..."
          className="block w-full mb-4 text-slate-800 py-3 px-2 text-md outline-gray-500 rounded border border-slate-400"
        />

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-14 flex items-center gap-2"
          disabled={apiGifsData.loading}
        >
          {apiGifsData.loading && !apiGifsData.error.state ? (
            <>
              <Spinner size="sm" color="text-white" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {apiGifsData.error.state && <p className="text-red-600 dark:text-red-400">{apiGifsData.error.msg}</p>}

      <ul
        className="
          grid 
          grid-cols-[repeat(auto-fill,minmax(200px,1fr))] 
          gap-2 
          justify-center
        "
      >
        {apiGifsData.gifs.map((gif, index) => {
          const isLast = index === apiGifsData.gifs.length - 1;
          return (
            <li
              key={gif.id}
              ref={isLast ? lastGifRef : null}
              className="
                relative
                overflow-hidden
                rounded
                aspect-[1/1]
                bg-slate-200
              "
            >
              <img
                src={gif.url}
                alt={gif.title}
                className="
                  w-full
                  h-full
                  object-cover
                  rounded 
                "
                loading="lazy"
              />
            </li>
          );
        })}
        {/* Skeleton lors du chargement */}
        {apiGifsData.loading &&
          Array.from({ length: 8 }).map((_, i) => <GifSkeleton key={i} />)}
      </ul>

      {apiGifsData.loading && !apiGifsData.error.state && (
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" color="text-blue-500" />
        </div>
      )}
    </>
  );
};

export default List;
