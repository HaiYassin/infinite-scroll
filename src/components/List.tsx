import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";
import useGifs from "../hooks/useGifs";

const List = () => {
  const lastGifRef = useRef<HTMLLIElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [querySearch] = useState<string>("random");
  const [pageNumber, setPageNumber] = useState<number>(0);
  const apiGifsData = useGifs(querySearch, pageNumber);

  useEffect(() => {
    if (apiGifsData.loading) return;
    if (!lastGifRef.current) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (
            entry.isIntersecting &&
            !apiGifsData.loading &&
            apiGifsData.gifs.length < apiGifsData.maxCount
          ) {
            setPageNumber((prev) => prev + 1);
          }
        },
        { rootMargin: "300px" }
      );
    }

    const observer = observerRef.current;
    const el = lastGifRef.current;
    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [apiGifsData.gifs, apiGifsData.loading, apiGifsData.maxCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <>
      <h1 className="text-4xl">GIF FINDER</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mb-4" htmlFor="gifSearch">
          Looking for gifs...
        </label>

        <input
          type="text"
          placeholder="Looking for something..."
          className="block w-full mb-4 text-slate-800 py-3 px-2 text-md outline-gray-500 rounded border border-slate-400"
        />

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-14 flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" color="text-white" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {!isLoading && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 justify-center">
          {apiGifsData.gifs.map((gif, index) => {
            const isLast = index === apiGifsData.gifs.length - 1;
            return (
              <li
                key={gif.id}
                ref={isLast ? lastGifRef : null}
                className="relative overflow-hidden rounded aspect-[4/3] bg-slate-200"
              >
                <img
                  src={gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover rounded opacity-0 transition-opacity duration-500 hover:scale-105"
                  loading="lazy"
                  onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                />
              </li>
            );
          })}
        </ul>
      )}

      {apiGifsData.loading && (
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" color="text-blue-500" />
        </div>
      )}
    </>
  );
};

export default List;
