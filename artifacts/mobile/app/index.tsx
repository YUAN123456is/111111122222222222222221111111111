import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

export default function Index() {
  const { isLoading, provider } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (!provider) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(home)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
