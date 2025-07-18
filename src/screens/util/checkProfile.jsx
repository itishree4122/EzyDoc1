import { Alert } from "react-native";
import { getToken } from "../auth/tokenHelper";
import { BASE_URL } from "../auth/Api";
import { fetchWithAuth } from "../auth/fetchWithAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const checkUserProfileCompletion = async (navigation) => {
  try {
    const token = await getToken();
    const userDataStr = await AsyncStorage.getItem("userData");
    const user = JSON.parse(userDataStr);

    const userDetails = {
      patientId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.mobile_number,
    };

    console.log("Profile check: BASE_URL", BASE_URL);
console.log("Profile check: token", token);

    const res = await fetchWithAuth(`${BASE_URL}/patients/profiles/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Profile check: status", res.status);

    if (!res.ok) throw new Error("Failed to fetch profile");

    const profileArray = await res.json();
    const profile = profileArray[0];  


    // check for profile completeness
if (!profile || !profile.date_of_birth || !profile.age || !profile.gender) {
        console.log("Profile check: Incomplete profile", profile);
      Alert.alert(
        "Profile Incomplete",
        "Please complete your profile (DOB, Gender, Address) to continue.",
        [
          {
            text: "Update Now",
            onPress: () => navigation.navigate("Profile",userDetails),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("Profile check error:", err);
    Alert.alert("Error", "Could not verify profile completeness.");
    return false;
  }
};
