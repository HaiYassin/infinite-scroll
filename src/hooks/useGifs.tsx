import { useEffect, useState } from "react";

interface Gif {
  id: string;
  title: string;
  url: string;
}

interface UseGifsReturn {
  gifs: Gif[];
  loading: boolean;
  error: {
    msg: string;
    statusCode: string | number;
    state: boolean;
  };
  maxCount: number;
  endReached: boolean;
}

interface ErrorInterface {
  msg: string;
  statusCode: string | number;
  state: boolean;
}

export default function useGifs(
  querySearch: string = "",
  pageNumber: number = 0
): UseGifsReturn {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorInterface>({
    msg: "",
    statusCode: "",
    state: false,
  });
  const [maxCount, setMaxCount] = useState<number>(0);
  const [endReached, setEndReached] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const GIPHY_API_KEY = import.meta.env.VITE_GIF_API_KEY;
    if (!GIPHY_API_KEY) {
      setError({
        msg: "Clé GIPHY manquante. Veuillez vérifier votre fichier .env.",
        statusCode: "400",
        state: true,
      });
      return;
    }

    const limit = 20;
    const offset = pageNumber * limit;
    const endpoint = querySearch
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          querySearch
        )}&limit=${limit}&offset=${offset}`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}`;

    fetch(endpoint)
      .then((response) => {
        if (!response.ok)
          throw new Error(`${response.status} Error, something went wrong.`);

        return response.json();
      })
      .then((data) => {
        if (ignore) return;

        const newGifs = data.data.map((gif: any) => ({
          id: gif.id,
          title: gif.title,
          url: gif.images.fixed_height.url,
        }));

        const total = data.pagination.total_count;
        const isFinished = newGifs.length === 0 || offset + limit >= total;

        setEndReached(isFinished);

        setGifs((prev) => {
          if (pageNumber === 0) return newGifs;

          const uniqueGifs = [
            ...prev,
            ...newGifs.filter((g: Gif) => !prev.some((p) => p.id === g.id)),
          ];

          console.log(uniqueGifs);

          return uniqueGifs;
        });

        setError({
          msg: data.meta.msg,
          statusCode: data.meta.status,
          state: false,
        });

        setMaxCount(total);

        setLoading(false);
      })
      .catch((err) => {
        setError({
          msg: err.message,
          statusCode: err.status,
          state: true,
        });
      });

    return () => {
      ignore = true;
    };
  }, [querySearch, pageNumber]);

  return { error, gifs, maxCount, loading, endReached };
}
