import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export default function IndexScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  if (isLoggedIn === null) return null;

  return isLoggedIn ? <Redirect href="/(tabs)/home" /> : <Redirect href="/(auth)/login" />;
}
