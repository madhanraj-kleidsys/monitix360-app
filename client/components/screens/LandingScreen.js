

 import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    Platform,
    Image,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

export default function LandingScreen({ navigation, onContinue }) {
    // Simple animation values - no bouncing
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const illustrationOpacity = useSharedValue(0);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        // Simple fade-in sequence - no movement, no bouncing
        logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.ease });
        textOpacity.value = withDelay(600, withTiming(1, { duration: 800, easing: Easing.ease }));
        illustrationOpacity.value = withDelay(1200, withTiming(1, { duration: 800, easing: Easing.ease }));
        contentOpacity.value = withDelay(1800, withTiming(1, { duration: 800, easing: Easing.ease }));
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const illustrationAnimatedStyle = useAnimatedStyle(() => ({
        opacity: illustrationOpacity.value,
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Light Premium Gradient Background */}
            <LinearGradient
                colors={['#F8F9FA', '#E8EAF6', '#F3E5F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Subtle accent circles */}
            <View style={styles.accentCircle1} />
            <View style={styles.accentCircle2} />

            {/* Content Container */}
            <View style={styles.contentContainer}>
                
                {/* Logo and Title */}
                <View style={styles.headerSection}>
                    <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                        <View style={styles.logoBackground}>
                            <Image
                                source={require('../../assets/app-icon.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>

                    <Animated.View style={textAnimatedStyle}>
                        <Text style={styles.appName}>Planning Tool</Text>
                        <Text style={styles.tagline}>Smart Task Management</Text>
                    </Animated.View>
                </View>

                {/* Premium Illustration */}
                <Animated.View style={[styles.illustrationContainer, illustrationAnimatedStyle]}>
                    <Image
                        // source={{ uri: 'https://i.pinimg.com/736x/86/12/15/861215c60e76d8818e46706abd80c817.jpg' }}
                        source={require('../../assets/landing_image.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Bottom Content */}
                <Animated.View style={[styles.bottomContent, contentAnimatedStyle]}>
                    <Text style={styles.description}>
                        Streamline your team's workflow with powerful task assignment, 
                        real-time monitoring, and comprehensive progress tracking.
                    </Text>

                    {/* Feature Tags */}
                    <View style={styles.featureTags}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>📋 Task Management</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>📊 Live Tracking</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>👥 Team Sync</Text>
                        </View>
                    </View>

                    {/* Get Started Button - keeping your liked color */}
                    <TouchableOpacity
                        style={styles.getStartedBtn}
                        onPress={() => {
                            if (onContinue) {
                                onContinue();
                            } else {
                                navigation.navigate('Login');
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#00D4FF', '#0099FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>Get Started</Text>
                            <Text style={styles.arrowIcon}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Auth Link */}
                    <View style={styles.authLink}>
                        <Text style={styles.authLinkText}>New to Planning Tool? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.authLinkHighlight}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    accentCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 153, 255, 0.08)',
        top: -100,
        right: -80,
    },
    accentCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(124, 58, 237, 0.06)',
        bottom: 100,
        left: -60,
    },
    contentContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: isSmallDevice ? 20 : 30,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoBackground: {
        width: isSmallDevice ? 90 : 110,
        height: isSmallDevice ? 90 : 110,
        borderRadius: 55,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    logoImage: {
        width: isSmallDevice ? 70 : 70,
        height: isSmallDevice ? 70 : 85,
    },
    appName: {
        fontSize: isSmallDevice ? 25 : 30,
        fontWeight: '900',
        color: '#1A1F3A',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: isSmallDevice ? 14 : 13,
        color: '#6B7280',
        textAlign: 'center',
        // marginTop: 6,
        fontWeight: '500',
    },
    illustrationContainer: {
        //  width: '100%',
        // alignItems: 'center',
        // marginBottom: 8,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: isSmallDevice ? 15 : 25,
        marginBottom: isSmallDevice ? 10 : 30,
    },
    illustration: {
        width: width * 0.85,
        height: height * 0.3,
        maxHeight: 280,
    },
    bottomContent: {
        // marginTop: 'auto',
        marginTop: 12,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    description: {
         fontSize: isSmallDevice ? 12 : 14,
        lineHeight: isSmallDevice ? 18 : 22,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: isSmallDevice ? 10 : 16,
        paddingHorizontal: 4,
    },
    featureTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: isSmallDevice ? 14 : 18,
    },
    tag: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tagText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
    },
    getStartedBtn: {
        width: '100%',
        marginBottom: 16,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#0099FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: isSmallDevice ? 15 : 17,
        paddingHorizontal: 32,
        gap: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    arrowIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    authLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 10,
    },
    authLinkText: {
        color: '#6B7280',
        fontSize: 14,
    },
    authLinkHighlight: {
        color: '#0099FF',
        fontSize: 14,
        fontWeight: '700',
    },
});