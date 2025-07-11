import React, { useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { databases } from '@/lib/appwrite';
import { CATEGORIES, getCategoryIconName, IoniconName } from '@/constants/categoryUtils';
import Spacer from '@/components/Spacer';
import { Query } from 'appwrite';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme.web';
import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';
import { Expense, MemberProfile , PieDataItem } from '@/types';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';

const CATEGORY_COLOR_MAP: Record<string, string>  = {
  Food: '#FFB300',
  Transportation: '#1976D2',
  Accommodation: '#4CAF50',
  Entertainment: '#E040FB',
  Utilities: '#FF7043',
  Shopping: '#00B8D4',
  Others: '#BDBDBD',
};
const CATEGORY_ORDER = [
  'Food',
  'Transportation',
  'Accommodation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Others',
];
const MEMBER_COLORS = [
  '#1976D2', '#FF7043', '#4CAF50', '#E040FB', '#FFB300', '#00B8D4', '#BDBDBD',
  '#F06292', '#A1887F', '#26A69A', '#7E57C2', '#FF8A65', '#C0CA33'
];

export default function GroupReportPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<'categories' | 'members'>('categories');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const chartBackground = Colors[colorScheme].background;

  useEffect(() => {
    let isMounted = true;
    if (!groupId) return;
    setLoading(true);
    (async () => {
      try {
        const expRes = await databases.listDocuments(
          databaseId,
          expensesCollectionId,
          [Query.equal('groupId', groupId)]
        );
        if (!isMounted) return;
        // setExpenses(expRes.documents);
        setExpenses(expRes.documents.map((doc: any) => ({
          $id: doc.$id,
          amount: doc.amount,
          paidBy: doc.paidBy,
          splitBetween: doc.splitBetween,
          splitType: doc.splitType,
          customSplit: doc.customSplit,
          description: doc.description,
          groupId: doc.groupId,
          category: doc.category ?? 'Others',
          $createdAt: doc.$createdAt,
        })));


        const memberIds = Array.from(new Set(expRes.documents.map(e => e.paidBy)));
        const profiles: MemberProfile[]  = await Promise.all(
          memberIds.map((uid: string) =>
            databases
              .getDocument(databaseId, usersCollectionId, uid)
              .then(profile => ({
                userId: uid,
                username: profile.username,
                avatar: profile.avatar || null,
              }))
              .catch(() => ({ userId: uid, username: '(unknown)', avatar: null }))
          )
        );
        if (!isMounted) return;
        setMemberProfiles(profiles);
      } catch (e) {
        setExpenses([]);
        setMemberProfiles([]);
      }
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, [groupId]);

  // Category Pie Data
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'Others';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount);
  });
  const categoryPieData = CATEGORY_ORDER
    .filter((cat: string) => categoryTotals[cat] > 0)
    .map((cat: string) => ({
      value: Number(categoryTotals[cat]),
      color: CATEGORY_COLOR_MAP[cat] || '#BDBDBD',
      label: cat,
      icon: getCategoryIconName(cat),
    }));

  // Member Pie Data
  const memberTotals: Record<string, number> = {};
  expenses.forEach(exp => {
    memberTotals[exp.paidBy] = (memberTotals[exp.paidBy] || 0) + Number(exp.amount);
  });
  const memberPieData = memberProfiles
    .map((profile, idx) => ({
      value: Number(memberTotals[profile.userId] || 0),
      color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
      label: profile.username,
      avatar: profile.avatar,
    }))
    .filter(d => d.value > 0);

  // Pie data for chart
  const pieData = mode === 'categories' ? categoryPieData : memberPieData;
  const widthAndHeight = Math.min(Dimensions.get('window').width, 320);
  const totalValue = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
        <Spacer height={30}/>
      <TouchableOpacity onPress={() => router.navigate(`/group/${groupId}`)} style={{ marginBottom: 12 }}>
        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.headerRow}>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === 'categories' && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setMode('categories');
              setSelectedIndex(null);
            }}
          >
            <Ionicons name="pricetags" size={16} color={mode === 'categories' ? '#fff' : Colors.primary} />
            <ThemedText style={[styles.toggleBtnText, mode === 'categories' && { color: '#fff' }]}>
              Categories
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === 'members' && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setMode('members');
              setSelectedIndex(null);
            }}
          >
            <Ionicons name="people" size={16} color={mode === 'members' ? '#fff' : Colors.primary} />
            <ThemedText style={[styles.toggleBtnText, mode === 'members' && { color: '#fff' }]}>
              Members
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
      <Spacer height={20}/>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : pieData.length === 0 ? (
          <ThemedText>No expenses to show.</ThemedText>
        ) : (
          <>
            <PieChart
                data={pieData}
                donut
                showText
                textColor="#333"
                innerCircleColor={chartBackground}
                textSize={13}
                focusOnPress
                onPress={( item: PieDataItem, index: number)  => setSelectedIndex(index)}
                labelsPosition="outward"
                centerLabelComponent={() =>
                    selectedIndex !== null && pieData[selectedIndex] ? (
                        <ThemedView style={{ alignItems: 'center' }}>
                        {/* Icon/avatar for selected slice */}
                        {mode === 'categories'  && 'icon' in pieData[selectedIndex] ? (
                            <Ionicons
                            name={pieData[selectedIndex].icon as IoniconName}
                            size={50}
                            color={pieData[selectedIndex].color}
                            style={{ marginBottom: 5 }}
                            />
                        ) : 'avatar' in pieData[selectedIndex] && pieData[selectedIndex].avatar ? (
                            <Image
                            source={{ uri: pieData[selectedIndex].avatar }}
                            style={{ width: 32, height: 32, borderRadius: 16, marginBottom: 5, backgroundColor: '#fff' }}
                            />
                        ) : (
                            <Ionicons
                            name="person-circle"
                            size={50}
                            color={pieData[selectedIndex].color}
                            style={{ marginBottom: 5 }}
                            />
                        )}
                        <ThemedText style={{ fontWeight: 'bold', fontSize: 20 }}>
                            {((pieData[selectedIndex].value / totalValue) * 100).toFixed(1)}%
                        </ThemedText>
                        <ThemedText style={{ fontSize: 16 }}>
                            {pieData[selectedIndex].label}
                        </ThemedText>
                        </ThemedView>
                    ) : (
                        <Image
                          source={require('@/assets/images/logo.png')}
                          style={{ width: 100, height: 100 }}
                          contentFit="contain"
                        />
                    )
                }

                radius={widthAndHeight / 2}
                innerRadius={widthAndHeight / 3}
            />

            <View style={{ marginTop: 24, width: '100%' }}>
              {pieData.map((item: PieDataItem, idx: number) => (
                <View key={item.label} style={styles.legendRow}>
                  {mode === 'categories' && 'icon' in item ? (
                    <Ionicons name={item.icon as IoniconName} size={24} color={item.color} style={{ marginRight: 8 }} />
                  ) : 'avatar' in item && item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person-circle" size={32} color={item.color} style={{ marginRight: 8 }} />
                  )}
                  <ThemedText style={{ flex: 1, fontSize: 15 }}>{item.label}</ThemedText>
                  <ThemedText style={{ color: item.color, fontWeight: 'bold', fontSize: 15 }}>
                    ${item.value.toFixed(2)}
                  </ThemedText>
                </View>
              ))}
            </View>
          </>
        )}
        <Spacer height={20} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    marginHorizontal: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#fff',
  },
});
