import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

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
}

export default function useGifs(
  querySearch: string = "",
  pageNumber: number = 0
): UseGifsReturn {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState({
    msg: "",
    statusCode: "",
    state: false,
  });
  const [maxCount, setMaxCount] = useState<number>(0);

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
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        const newGifs = data.data.map((gif: any) => ({
          id: gif.id,
          title: gif.title,
          url: gif.images.fixed_height.url,
        }));
        setGifs((prev) => [...prev, ...newGifs]);
        setError({
          msg: data.meta.msg,
          statusCode: data.meta.status,
          state: false,
        });
        setMaxCount(data.pagination.total_count);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [querySearch, pageNumber]);

  return { error, gifs, maxCount, loading };
}
