import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
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
  size = 200,
  color = { dark: '#12234E', light: '#FFFFFF' },
  logo,
  logoSize = 38,
  style,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    QRCode.toDataURL(
      value,
      {
        width: Math.max(size * 2, 400),
        margin: 1,
        color: {
          dark: color.dark || '#12234E',
          light: color.light || '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // High error correction to allow center logo overlay
      },
      (err: any, url: string) => {
        if (!isMounted) return;
        if (err) {
          console.error('QR Code generation error:', err);
          setDataUrl(null);
        } else {
          setDataUrl(url);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [value, size, color.dark, color.light]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {loading ? (
        <View style={[styles.loadingBox, { width: size, height: size }]}>
          <ActivityIndicator size="small" color={colors.brandNavy} />
        </View>
      ) : dataUrl ? (
        <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={{ uri: dataUrl }}
            style={{ width: size, height: size, borderRadius: radius.sm }}
            resizeMode="contain"
          />
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
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
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
