import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react-native';

type Props = {
  visible: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
};

export default function StatusModal({ visible, type, message, onClose }: Props) {

  const config = {
    success: {
      icon: CheckCircle,
      color: '#22c55e',
      title: 'Success'
    },
    error: {
      icon: AlertCircle,
      color: '#ef4444',
      title: 'Error'
    },
    warning: {
      icon: AlertTriangle,
      color: '#f59e0b',
      title: 'Warning'
    }
  };

  const data = config[type];
  const IconComponent = data.icon;

  return (
    <Modal transparent visible={visible} animationType="fade">

      <View style={styles.overlay}>

        <View style={styles.box}>

          <IconComponent size={60} color={data.color} />

          <Text style={styles.title}>{data.title}</Text>

          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>

        </View>

      </View>

    </Modal>
  );
}

const styles = StyleSheet.create({

  overlay:{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent:'center',
    alignItems:'center'
  },

  box:{
    backgroundColor:'#fff',
    padding:30,
    borderRadius:14,
    width:'80%',
    alignItems:'center'
  },

  title:{
    fontSize:24,
    fontWeight:'700',
    marginTop:10
  },

  message:{
    marginTop:8,
    color:'#555',
    textAlign:'center'
  },

  btn:{
    marginTop:20,
    backgroundColor:'#007AFF',
    paddingVertical:10,
    paddingHorizontal:25,
    borderRadius:8,
    width: '100%'
  },

  btnText:{
    color:'#fff',
    fontWeight:'600',
    textAlign: 'center',
    fontSize: 18
  }

});