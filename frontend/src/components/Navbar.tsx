'use client';

import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { SportsCricket, AccountCircle } from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { user, logout, isAuthenticated, isManager, isSuperAdmin } = useAuth();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
    };

    return (
        <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
            <Container maxWidth="lg">
                <Toolbar disableGutters>
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                        <SportsCricket sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                mr: 2,
                                fontWeight: 700,
                                color: 'text.primary',
                                textDecoration: 'none',
                            }}
                        >
                            BoxCricket
                        </Typography>
                    </Link>

                    {/* Desktop Menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                        <Button component={Link} href="/venues" color="inherit">
                            Venues
                        </Button>
                        {isAuthenticated && (
                            <Button component={Link} href="/bookings/history" color="inherit">
                                My Bookings
                            </Button>
                        )}
                        {isManager && (
                            <Button component={Link} href="/manager/dashboard" color="primary">
                                Manager Dashboard
                            </Button>
                        )}
                        {isSuperAdmin && (
                            <Button component={Link} href="/admin/dashboard" color="secondary">
                                Admin Panel
                            </Button>
                        )}
                    </Box>

                    {/* User Menu */}
                    <Box sx={{ flexGrow: 0 }}>
                        {isAuthenticated ? (
                            <>
                                <IconButton
                                    size="large"
                                    aria-label="account of current user"
                                    aria-controls="menu-appbar"
                                    aria-haspopup="true"
                                    onClick={handleMenu}
                                    color="inherit"
                                >
                                    {user?.first_name ? (
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                                            {user.first_name[0]}
                                        </Avatar>
                                    ) : (
                                        <AccountCircle />
                                    )}
                                </IconButton>
                                <Menu
                                    id="menu-appbar"
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(anchorEl)}
                                    onClose={handleClose}
                                >
                                    <MenuItem disabled>
                                        <Typography variant="body2" color="text.secondary">
                                            {user?.email}
                                        </Typography>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleClose(); router.push('/bookings/history'); }}>My Bookings</MenuItem>
                                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button component={Link} href="/login" variant="contained" color="primary">
                                Sign In
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
