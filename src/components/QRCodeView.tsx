import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import QRCode from 'qrcode';
import { colors, radius } from '../theme/tokens';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  logo?: any;
  logoSize?: number;
  style?: any;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  color = { dark: '#004961', light: '#FFFFFF' },
  logo,
  logoSize = 36,
  style,
}) => {
  const darkColor = color.dark || '#004961';
  const lightColor = color.light || '#FFFFFF';

  const matrix = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'WELLIPASS-EMPTY', {
        errorCorrectionLevel: 'M',
      });
      const moduleCount = qr.modules.size;
      const rows: boolean[][] = [];
      for (let r = 0; r < moduleCount; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < moduleCount; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        rows.push(row);
      }
      return { moduleCount, rows };
    } catch (e) {
      console.warn('QR code matrix generation failed:', e);
      return null;
    }
  }, [value]);

  if (!matrix) {
    return null;
  }

  const cellSize = size / matrix.moduleCount;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: lightColor,
        },
        style,
      ]}
    >
      <View style={{ width: size, height: size }}>
        {matrix.rows.map((row, rIdx) => (
          <View key={`r-${rIdx}`} style={{ flexDirection: 'row', height: cellSize }}>
            {row.map((isDark, cIdx) => (
              <View
                key={`c-${cIdx}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: isDark ? darkColor : lightColor,
                }}
              />
            ))}
          </View>
        ))}
      </View>

      {logo && (
        <View
          style={[
            styles.logoWrap,
            {
              width: logoSize + 8,
              height: logoSize + 8,
              borderRadius: (logoSize + 8) / 2,
            },
          ]}
        >
          <Image
            source={logo}
            style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  logoWrap: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
