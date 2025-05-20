import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  Image
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

const TodaysPatients = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState("All");
  const [completedIds, setCompletedIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const todayDate = new Date().toISOString().split("T")[0];

  const initialPatients = [
    {
      id: "1",
      name: "John Doe",
      date: todayDate,
      time: "09:30 AM",
      phone: "123-456-7890",
      address: "123 Main St",
      bloodGroup: "A+",
      age: 30,
      gender: "Male",
      insurance: "Yes"
    },
    {
      id: "2",
      name: "Jane Smith",
      date: todayDate,
      time: "11:00 AM",
      phone: "987-654-3210",
      address: "456 Oak Ave",
      bloodGroup: "B-",
      age: 28,
      gender: "Female",
      insurance: "No"
    },
    {
      id: "3",
      name: "Anora Nora",
      date: todayDate,
      time: "10:30 AM",
      phone: "123-456-7890",
      address: "123 Main St",
      bloodGroup: "A+",
      age: 30,
      gender: "Male",
      insurance: "Yes"
    },
    {
      id: "4",
      name: "April Smith",
      date: todayDate,
      time: "10:00 AM",
      phone: "987-654-3210",
      address: "456 Oak Ave",
      bloodGroup: "B-",
      age: 28,
      gender: "Female",
      insurance: "No"
    },
    {
      id: "5",
      name: "Johnny Mars",
      date: todayDate,
      time: "02:30 PM",
      phone: "123-456-7890",
      address: "123 Main St",
      bloodGroup: "A+",
      age: 30,
      gender: "Male",
      insurance: "Yes"
    },
    {
      id: "6",
      name: "Nicole Jackson",
      date: todayDate,
      time: "02:00 PM",
      phone: "987-654-3210",
      address: "456 Oak Ave",
      bloodGroup: "B-",
      age: 28,
      gender: "Female",
      insurance: "No"
    },
    {
      id: "7",
      name: "Allen Woods",
      date: todayDate,
      time: "11:30 AM",
      phone: "123-456-7890",
      address: "123 Main St",
      bloodGroup: "A+",
      age: 30,
      gender: "Male",
      insurance: "Yes"
    },
    {
      id: "8",
      name: "Nora Jones",
      date: todayDate,
      time: "11:00 AM",
      phone: "987-654-3210",
      address: "456 Oak Ave",
      bloodGroup: "B-",
      age: 28,
      gender: "Female",
      insurance: "No"
    },
    
  ];

  const [patients, setPatients] = useState(initialPatients);

  const handleDone = (id, name) => {
    setCompletedIds((prev) => [...prev, id]);
    ToastAndroid.show(`Session is over for ${name}`, ToastAndroid.SHORT);
    setTimeout(() => {
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }, 1500);
  };
  const handleCancel = (id) => {
    setPatients((prevList) => prevList.filter((item) => item.id !== id));
  };
  const handleCancelSelected = () => {
    const updatedList = patients.filter(
      (item) => !selectedIds.includes(item.id)
    );
    setPatients(updatedList); // remove from the list
    setSelectedIds([]);       // clear selection
  };
  

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleReschedulePress = () => {
    setShowDatePicker(true);
  };

  const onDateSelected = (event, date) => {
    if (date) {
      setTempDate(date);
      setShowDatePicker(false);
      setTimeout(() => setShowTimePicker(true), 300); // delay for smoother UX
    } else {
      setShowDatePicker(false);
    }
  };

  const onTimeSelected = (event, time) => {
    if (time) {
      const newDate = new Date(tempDate);
      newDate.setHours(time.getHours());
      newDate.setMinutes(time.getMinutes());

      const formattedDate = newDate.toISOString().split("T")[0];
      const formattedTime = newDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const updated = patients.map((p) =>
        selectedIds.includes(p.id)
          ? { ...p, date: formattedDate, time: formattedTime }
          : p
      );

      setPatients(updated);
      ToastAndroid.show(
        `Rescheduled ${selectedIds.length} patients to ${formattedDate} ${formattedTime}`,
        ToastAndroid.LONG
      );
      setSelectedIds([]);
      setShowTimePicker(false);
    } else {
      setShowTimePicker(false);
    }
  };

  const getFilteredPatients = () => {
    const filtered = patients.filter((p) => !completedIds.includes(p.id));
    if (filter === "All") return filtered;
    return filtered.filter((p) => {
      const hour = parseInt(p.time.split(":")[0]);
      if (filter === "Morning" && hour >= 6 && hour < 12) return true;
      if (filter === "Afternoon" && hour >= 12 && hour < 16) return true;
      if (filter === "Evening" && hour >= 16 && hour < 20) return true;
      if (filter === "Night" && hour >= 20) return true;
      return false;
    });
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require("../assets/left-arrow.png")} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.header}>Today's Patients</Text>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        {["All", "Morning", "Afternoon", "Evening", "Night"].map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterButton,
              filter === option && styles.activeFilter,
            ]}
            onPress={() => setFilter(option)}
          >
            <Text
              style={[
                styles.filterText,
                filter === option && styles.activeFilterText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reschedule button */}
      {selectedIds.length > 0 && (
  <>
    <TouchableOpacity
      style={styles.rescheduleBtn}
      onPress={handleReschedulePress}
    >
      <Text style={styles.rescheduleText}>Reschedule ({selectedIds.length})</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cancelBtn}
      onPress={handleCancelSelected}
    >
      <Text style={styles.cancelText}>Cancel Selected ({selectedIds.length})</Text>
    </TouchableOpacity>
  </>
)}


      {/* Patient list */}
      <FlatList
  data={getFilteredPatients()}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.card,
          completedIds.includes(item.id) && styles.disabledCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.serial}>#{item.id}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>{item.time} | {item.date}</Text>
            
            {/* Extra Details */}
            <Text style={styles.info}>Phone: {item.phone}</Text>
            <Text style={styles.info}>Address: {item.address}</Text>
            <Text style={styles.info}>Blood Group: {item.bloodGroup}</Text>
            <Text style={styles.info}>Age: {item.age}</Text>
            <Text style={styles.info}>Gender: {item.gender}</Text>
            <Text style={styles.info}>Insurance: {item.insurance}</Text>
          </View>

          {!completedIds.includes(item.id) && (
  <View style={{ alignItems: "flex-end" }}>
    <TouchableOpacity
      style={styles.doneButton}
      onPress={() => handleDone(item.id, item.name)}
    >
      <Text style={styles.doneText}>Done</Text>
    </TouchableOpacity>

  </View>
)}

        </View>
      </TouchableOpacity>
    );
  }}
  contentContainerStyle={styles.listContainer}
/>


      {/* Date & Time Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateSelected}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={onTimeSelected}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6495ed",
    padding: 15,
  },
  backIcon: { width: 25, height: 25, tintColor: "#fff" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0047ab",
  },
  filterText: {
    fontSize: 14,
    color: "#0047ab",
  },
  activeFilter: {
    backgroundColor: "#6495ed",
  },
  activeFilterText: {
    color: "white",
  },
  rescheduleBtn: {
    backgroundColor: "#6495ed",
    padding: 10,
    marginHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 5,
  },
  rescheduleText: {
    fontWeight: "bold",
    color: "#fff",
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 10,
  },
  disabledCard: {
    backgroundColor: "#d3d3d3",
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#6495ed",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serial: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  details: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: "#28a745",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  doneText: {
    color: "white",
    fontWeight: "bold",
  },
  cancelBtn: {
    backgroundColor: "#ff4d4d",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 15,
    alignItems: "center",
    marginBottom: 10,
    marginTop: 5,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
  },
  
  
  info: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
});

export default TodaysPatients;
