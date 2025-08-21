import { StyleSheet, View, TouchableOpacity, ScrollView, FlatList, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import Header from '../components/Header';

// Define state and district types
interface State {
  id: number;
  name: string;
}

// Sample data for states and districts
const STATES: State[] = [
  { id: 1, name: 'Andhra Pradesh' },
  { id: 2, name: 'Assam' },
  { id: 3, name: 'Bihar' },
  { id: 4, name: 'Chhattisgarh' },
  { id: 5, name: 'Delhi' },
  { id: 6, name: 'Gujarat' },
  { id: 7, name: 'Haryana' },
  { id: 8, name: 'Karnataka' },
  { id: 9, name: 'Kerala' },
  { id: 10, name: 'Madhya Pradesh' },
  { id: 11, name: 'Maharashtra' },
  { id: 12, name: 'Punjab' },
  { id: 13, name: 'Rajasthan' },
  { id: 14, name: 'Tamil Nadu' },
  { id: 15, name: 'Telangana' },
  { id: 16, name: 'Uttar Pradesh' },
  { id: 17, name: 'West Bengal' },
];

// Districts mapped to state IDs
const DISTRICTS: Record<number, string[]> = {
  1: ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Prakasam', 'Srikakulam', 'Visakhapatnam'],
  2: ['Baksa', 'Barpeta', 'Biswanath', 'Cachar', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara'],
  3: ['Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga'],
  4: ['Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada', 'Dhamtari'],
  5: ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'South Delhi'],
  6: ['Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur'],
  7: ['Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind'],
  8: ['Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikballapur'],
  9: ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram'],
  10: ['Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind', 'Bhopal'],
  11: ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule'],
  12: ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur'],
  13: ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi'],
  14: ['Ariyalur', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram'],
  15: ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal'],
  16: ['Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh', 'Baghpat'],
  17: ['Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri'],
};

export default function RegionScreen() {
  const navigation = useNavigation();
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const stateDropdownHeight = useRef(new Animated.Value(0)).current;
  const districtDropdownHeight = useRef(new Animated.Value(0)).current;
  
  // Animation for dropdown
  useEffect(() => {
    Animated.timing(stateDropdownHeight, {
      toValue: isStateDropdownOpen ? 300 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isStateDropdownOpen]);
  
  useEffect(() => {
    Animated.timing(districtDropdownHeight, {
      toValue: isDistrictDropdownOpen ? 300 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDistrictDropdownOpen]);
  
  const toggleStateDropdown = () => {
    setIsStateDropdownOpen(!isStateDropdownOpen);
    if (isDistrictDropdownOpen) {
      setIsDistrictDropdownOpen(false);
    }
  };
  
  const toggleDistrictDropdown = () => {
    if (selectedState) {
      setIsDistrictDropdownOpen(!isDistrictDropdownOpen);
      if (isStateDropdownOpen) {
        setIsStateDropdownOpen(false);
      }
    }
  };
  
  const selectState = (state: State) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setIsStateDropdownOpen(false);
  };
  
  const selectDistrict = (district: string) => {
    setSelectedDistrict(district);
    setIsDistrictDropdownOpen(false);
  };
  
  const handleSaveRegion = () => {
    if (selectedState && selectedDistrict) {
      // Save region logic here
      navigation.goBack();
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Header */}
        <Header title="Set Your Region" />
        
        {/* Title Section */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>Choose your location</ThemedText>
          <View style={styles.titleUnderline} />
          <ThemedText style={styles.subtitle}>
            Setting your region helps us provide content relevant to your area
          </ThemedText>
        </ThemedView>
        
        {/* State Selection */}
        <ThemedView style={styles.selectionContainer}>
          <ThemedText style={styles.sectionLabel}>State</ThemedText>
          
          <TouchableOpacity 
            style={styles.dropdownToggle}
            onPress={toggleStateDropdown}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.selectedText}>
              {selectedState ? selectedState.name : 'Select your state'}
            </ThemedText>
            <FontAwesome 
              name={isStateDropdownOpen ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#666666" 
            />
          </TouchableOpacity>
          
          <Animated.View style={[styles.dropdownContainer, { height: stateDropdownHeight }]}>
            <FlatList
              data={STATES}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }: { item: State }) => (
                <TouchableOpacity 
                  style={[
                    styles.dropdownItem,
                    selectedState?.id === item.id && styles.selectedDropdownItem
                  ]}
                  onPress={() => selectState(item)}
                >
                  <ThemedText 
                    style={[
                      styles.dropdownItemText,
                      selectedState?.id === item.id && styles.selectedDropdownItemText
                    ]}
                  >
                    {item.name}
                  </ThemedText>
                  {selectedState?.id === item.id && (
                    <FontAwesome name="check" size={16} color="#dc2929" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              style={styles.dropdownList}
            />
          </Animated.View>
          
          {/* District Selection */}
          <ThemedText style={[styles.sectionLabel, { marginTop: 20 }]}>District</ThemedText>
          
          <TouchableOpacity 
            style={[
              styles.dropdownToggle,
              !selectedState && styles.disabledDropdown
            ]}
            onPress={toggleDistrictDropdown}
            activeOpacity={selectedState ? 0.8 : 1}
            disabled={!selectedState}
          >
            <ThemedText 
              style={[
                styles.selectedText,
                !selectedState && styles.disabledText
              ]}
            >
              {selectedDistrict || (selectedState ? 'Select your district' : 'Please select a state first')}
            </ThemedText>
            {selectedState && (
              <FontAwesome 
                name={isDistrictDropdownOpen ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#666666" 
              />
            )}
          </TouchableOpacity>
          
          <Animated.View style={[styles.dropdownContainer, { height: districtDropdownHeight }]}>
            {selectedState && (
              <FlatList
                data={DISTRICTS[selectedState.id]}
                keyExtractor={(item) => item}
                renderItem={({ item }: { item: string }) => (
                  <TouchableOpacity 
                    style={[
                      styles.dropdownItem,
                      selectedDistrict === item && styles.selectedDropdownItem
                    ]}
                    onPress={() => selectDistrict(item)}
                  >
                    <ThemedText 
                      style={[
                        styles.dropdownItemText,
                        selectedDistrict === item && styles.selectedDropdownItemText
                      ]}
                    >
                      {item}
                    </ThemedText>
                    {selectedDistrict === item && (
                      <FontAwesome name="check" size={16} color="#dc2929" />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                style={styles.dropdownList}
              />
            )}
          </Animated.View>
        </ThemedView>
        
        {/* Map Preview */}
        <ThemedView style={styles.mapPreview}>
          <FontAwesome name="map" size={60} color="#226cae" />
          <ThemedText style={styles.mapPlaceholderText}>
            {selectedState && selectedDistrict 
              ? `${selectedDistrict}, ${selectedState.name}`
              : 'Map preview will appear here'}
          </ThemedText>
        </ThemedView>
        
        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!selectedState || !selectedDistrict) && styles.disabledButton
          ]}
          onPress={handleSaveRegion}
          disabled={!selectedState || !selectedDistrict}
        >
          <ThemedText style={styles.saveButtonText}>Save Region</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#dc2929',
    borderRadius: 1.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedText: {
    fontSize: 16,
    color: '#333333',
  },
  disabledDropdown: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  disabledText: {
    color: '#999999',
  },
  dropdownContainer: {
    overflow: 'hidden',
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownList: {
    flex: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedDropdownItemText: {
    color: '#dc2929',
    fontWeight: '600',
  },
  mapPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  mapPlaceholderText: {
    marginTop: 15,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#dc2929',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 