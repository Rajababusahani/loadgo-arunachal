import { Text, TouchableOpacity, View } from "react-native";

interface VehicleCardProps {
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}

export function VehicleCard({ label, subtitle, selected, onPress }: VehicleCardProps) {
  return (
    <TouchableOpacity onPress={onPress} className={selected ? "rounded-3xl border-2 border-brand bg-emerald-50 p-4" : "rounded-3xl border border-slate-200 bg-white p-4"}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-semibold text-slate-900">{label}</Text>
          <Text className="mt-1 text-slate-600">{subtitle}</Text>
        </View>
        <View className={selected ? "h-5 w-5 rounded-full bg-brand" : "h-5 w-5 rounded-full border border-slate-300"} />
      </View>
    </TouchableOpacity>
  );
}
